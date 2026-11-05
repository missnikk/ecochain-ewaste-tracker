// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title EWasteTracker - role-gated e-waste lifecycle with certificate anchoring
/// @notice Academic prototype. Roles are enforced with a mapping and modifiers (RBAC).
contract EWasteTracker {
    enum Role { None, Admin, Producer, Consumer, Collector, Recycler }
    enum Status { Registered, PickupRequested, Collected, InTransit, AtRecycler, Recycled }

    struct Device {
        uint256 id;
        uint8 category;          // 1..7 = Schedule I category index
        bytes32 metaHash;        // SHA-256 of canonical off-chain metadata
        address producer;
        address owner;           // original owner, receives Green Points
        address custodian;       // current holder
        address pendingRecipient;
        Status status;
        uint256 receivedGrams;
        uint256 recoveredGrams;
        uint256 residualGrams;
        bytes32 certificateHash; // SHA-256 of the recycling certificate file
        uint256 createdAt;
        uint256 updatedAt;
    }

    struct Entry {
        Status status;
        address actor;
        uint256 timestamp;
        string note;
    }

    uint256 public constant GRAMS_PER_POINT = 100;

    address public admin;
    bool public paused;
    uint256 public deviceCount;
    uint256 public totalRecoveredGrams;

    mapping(address => Role) public roles;
    mapping(address => uint256) public greenPoints;
    mapping(Status => uint256) public statusCount;
    mapping(uint256 => Device) private devices;
    mapping(uint256 => Entry[]) private history;

    event RoleAssigned(address indexed account, Role role);
    event DeviceRegistered(uint256 indexed deviceId, uint8 category, address indexed owner, address indexed producer, bytes32 metaHash);
    event StatusChanged(uint256 indexed deviceId, Status status, address indexed actor, string note);
    event CertificateAnchored(uint256 indexed deviceId, bytes32 certificateHash, address indexed recycler, uint256 recoveredGrams);
    event PointsAwarded(address indexed owner, uint256 indexed deviceId, uint256 points);
    event PausedStateChanged(bool paused, address indexed by);

    modifier onlyRole(Role r) {
        require(roles[msg.sender] == r, "EWT: caller lacks required role");
        _;
    }
    modifier whenNotPaused() {
        require(!paused, "EWT: system paused");
        _;
    }
    modifier exists(uint256 id) {
        require(id > 0 && id <= deviceCount, "EWT: unknown device");
        _;
    }

    constructor() {
        admin = msg.sender;
        roles[msg.sender] = Role.Admin;
        emit RoleAssigned(msg.sender, Role.Admin);
    }

    // ---------- administration ----------
    function assignRole(address account, Role role) external onlyRole(Role.Admin) {
        require(account != address(0), "EWT: zero address");
        require(account != msg.sender, "EWT: admin cannot change own role");
        roles[account] = role;
        emit RoleAssigned(account, role);
    }

    function setPaused(bool state) external onlyRole(Role.Admin) {
        paused = state;
        emit PausedStateChanged(state, msg.sender);
    }

    // ---------- lifecycle ----------
    function registerDevice(
        uint8 category,
        bytes32 metaHash,
        address owner_,
        string calldata note
    ) external onlyRole(Role.Producer) whenNotPaused returns (uint256 id) {
        require(category >= 1 && category <= 7, "EWT: invalid category");
        require(metaHash != bytes32(0), "EWT: empty metadata hash");
        require(roles[owner_] == Role.Consumer, "EWT: owner must be a registered consumer");

        id = ++deviceCount;
        Device storage d = devices[id];
        d.id = id;
        d.category = category;
        d.metaHash = metaHash;
        d.producer = msg.sender;
        d.owner = owner_;
        d.custodian = owner_;
        d.status = Status.Registered;
        d.createdAt = block.timestamp;
        d.updatedAt = block.timestamp;

        statusCount[Status.Registered] += 1;
        history[id].push(Entry(Status.Registered, msg.sender, block.timestamp, note));

        emit DeviceRegistered(id, category, owner_, msg.sender, metaHash);
        emit StatusChanged(id, Status.Registered, msg.sender, note);
    }

    function requestPickup(uint256 id, string calldata note) external exists(id) whenNotPaused {
        Device storage d = devices[id];
        require(msg.sender == d.owner, "EWT: only the device owner");
        require(d.status == Status.Registered, "EWT: invalid state");
        _move(d, Status.PickupRequested, note);
    }

    function confirmCollection(uint256 id, string calldata note)
        external onlyRole(Role.Collector) exists(id) whenNotPaused
    {
        Device storage d = devices[id];
        require(d.status == Status.PickupRequested, "EWT: invalid state");
        d.custodian = msg.sender;
        _move(d, Status.Collected, note);
    }

    function dispatchToRecycler(uint256 id, address recycler, string calldata note)
        external onlyRole(Role.Collector) exists(id) whenNotPaused
    {
        Device storage d = devices[id];
        require(d.status == Status.Collected, "EWT: invalid state");
        require(d.custodian == msg.sender, "EWT: not the custodian");
        require(roles[recycler] == Role.Recycler, "EWT: recipient is not a recycler");
        d.pendingRecipient = recycler;
        _move(d, Status.InTransit, note);
    }

    function confirmReceipt(uint256 id, uint256 receivedGrams, string calldata note)
        external onlyRole(Role.Recycler) exists(id) whenNotPaused
    {
        Device storage d = devices[id];
        require(d.status == Status.InTransit, "EWT: invalid state");
        require(d.pendingRecipient == msg.sender, "EWT: not the designated recycler");
        require(receivedGrams > 0, "EWT: weight must be positive");
        d.receivedGrams = receivedGrams;
        d.custodian = msg.sender;
        d.pendingRecipient = address(0);
        _move(d, Status.AtRecycler, note);
    }

    function completeRecycling(
        uint256 id,
        uint256 recoveredGrams,
        uint256 residualGrams,
        bytes32 certificateHash,
        string calldata note
    ) external onlyRole(Role.Recycler) exists(id) whenNotPaused {
        Device storage d = devices[id];
        require(d.status == Status.AtRecycler, "EWT: invalid state");
        require(d.custodian == msg.sender, "EWT: not the custodian");
        require(certificateHash != bytes32(0), "EWT: certificate hash required");
        require(recoveredGrams + residualGrams == d.receivedGrams, "EWT: mass balance mismatch");

        d.recoveredGrams = recoveredGrams;
        d.residualGrams = residualGrams;
        d.certificateHash = certificateHash;
        totalRecoveredGrams += recoveredGrams;

        uint256 pts = recoveredGrams / GRAMS_PER_POINT;
        greenPoints[d.owner] += pts;

        _move(d, Status.Recycled, note);
        emit CertificateAnchored(id, certificateHash, msg.sender, recoveredGrams);
        emit PointsAwarded(d.owner, id, pts);
    }

    // ---------- views ----------
    function getDevice(uint256 id) external view exists(id) returns (Device memory) {
        return devices[id];
    }

    function getHistory(uint256 id) external view exists(id) returns (Entry[] memory) {
        return history[id];
    }

    function verifyCertificate(uint256 id, bytes32 fileHash) external view exists(id) returns (bool) {
        Device storage d = devices[id];
        return d.status == Status.Recycled && d.certificateHash == fileHash;
    }

    function verifyMetadata(uint256 id, bytes32 metaHash) external view exists(id) returns (bool) {
        return devices[id].metaHash == metaHash;
    }

    // ---------- internal ----------
    function _move(Device storage d, Status next, string memory note) internal {
        statusCount[d.status] -= 1;
        statusCount[next] += 1;
        d.status = next;
        d.updatedAt = block.timestamp;
        history[d.id].push(Entry(next, msg.sender, block.timestamp, note));
        emit StatusChanged(d.id, next, msg.sender, note);
    }
}
