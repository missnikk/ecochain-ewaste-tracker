const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EWasteTracker v2", function () {
  let contract;
  let admin, producer, consumer, collector, recycler, unauthorized, consumer2, other;
  const HASH_ZERO = "0x" + "00".repeat(32);
  const DUMMY_HASH = "0x" + "aa".repeat(32);
  const DUMMY_HASH2 = "0x" + "bb".repeat(32);
  const CERT_HASH_1 = "0x" + "11".repeat(32);
  const CERT_HASH_2 = "0x" + "22".repeat(32);

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    [admin, producer, consumer, collector, recycler, unauthorized, consumer2, other] = signers;

    const Factory = await ethers.getContractFactory("EWasteTracker");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  describe("Constructor & Roles", function () {
    it("deployer is admin", async function () {
      expect(await contract.admin()).to.equal(admin.address);
      expect(await contract.roles(admin.address)).to.equal(1); // Role.Admin
    });

    it("unregistered account has Role.None (0)", async function () {
      expect(await contract.roles(unauthorized.address)).to.equal(0);
    });
  });

  describe("Self Registration", function () {
    it("account can self-register as Producer", async function () {
      await expect(contract.connect(producer).selfRegister(2))
        .to.emit(contract, "RoleAssigned").withArgs(producer.address, 2);
      expect(await contract.roles(producer.address)).to.equal(2);
    });

    it("account can self-register as Consumer", async function () {
      await expect(contract.connect(consumer).selfRegister(3))
        .to.emit(contract, "RoleAssigned").withArgs(consumer.address, 3);
      expect(await contract.roles(consumer.address)).to.equal(3);
    });

    it("account can self-register as Collector", async function () {
      await expect(contract.connect(collector).selfRegister(4))
        .to.emit(contract, "RoleAssigned").withArgs(collector.address, 4);
      expect(await contract.roles(collector.address)).to.equal(4);
    });

    it("account can self-register as Recycler", async function () {
      await expect(contract.connect(recycler).selfRegister(5))
        .to.emit(contract, "RoleAssigned").withArgs(recycler.address, 5);
      expect(await contract.roles(recycler.address)).to.equal(5);
    });

    it("self-registering twice is rejected", async function () {
      await contract.connect(producer).selfRegister(2);
      await expect(contract.connect(producer).selfRegister(2))
        .to.be.revertedWith("EWT: already registered");
    });

    it("cannot self-register as Admin (1)", async function () {
      await expect(contract.connect(other).selfRegister(1))
        .to.be.revertedWith("EWT: role not self-selectable");
    });

    it("cannot self-register as None (0)", async function () {
      await expect(contract.connect(other).selfRegister(0))
        .to.be.revertedWith("EWT: role not self-selectable");
    });

    it("self-registration reverts when system is paused", async function () {
      await contract.connect(admin).setPaused(true);
      await expect(contract.connect(producer).selfRegister(2))
        .to.be.revertedWith("EWT: system paused");
    });

    it("suspended account cannot self-register", async function () {
      await contract.connect(admin).setSuspended(other.address, true);
      await expect(contract.connect(other).selfRegister(3))
        .to.be.revertedWith("EWT: account suspended");
    });
  });

  describe("Admin Overrides & Governance", function () {
    it("admin can assign any role", async function () {
      await expect(contract.connect(admin).assignRole(producer.address, 2))
        .to.emit(contract, "RoleAssigned").withArgs(producer.address, 2);
      expect(await contract.roles(producer.address)).to.equal(2);
    });

    it("admin can reset an account's role to None", async function () {
      await contract.connect(producer).selfRegister(2);
      await contract.connect(admin).assignRole(producer.address, 0);
      expect(await contract.roles(producer.address)).to.equal(0);
    });

    it("assigning role to zero address reverts", async function () {
      await expect(contract.connect(admin).assignRole(ethers.ZeroAddress, 2))
        .to.be.revertedWith("EWT: zero address");
    });

    it("admin cannot change own role", async function () {
      await expect(contract.connect(admin).assignRole(admin.address, 2))
        .to.be.revertedWith("EWT: admin cannot change own role");
    });

    it("non-admin cannot assign roles", async function () {
      await expect(contract.connect(unauthorized).assignRole(other.address, 2))
        .to.be.revertedWith("EWT: caller lacks required role");
    });

    it("admin can suspend and reinstate an account", async function () {
      await expect(contract.connect(admin).setSuspended(producer.address, true))
        .to.emit(contract, "AccountSuspended").withArgs(producer.address, true, admin.address);
      expect(await contract.suspended(producer.address)).to.be.true;

      await expect(contract.connect(admin).setSuspended(producer.address, false))
        .to.emit(contract, "AccountSuspended").withArgs(producer.address, false, admin.address);
      expect(await contract.suspended(producer.address)).to.be.false;
    });

    it("suspension blocks registered user from acting", async function () {
      await contract.connect(producer).selfRegister(2);
      await contract.connect(admin).setSuspended(producer.address, true);
      await expect(contract.connect(producer).registerDevice(1, DUMMY_HASH, "new item"))
        .to.be.revertedWith("EWT: account suspended");
    });

    it("admin cannot suspend self", async function () {
      await expect(contract.connect(admin).setSuspended(admin.address, true))
        .to.be.revertedWith("EWT: admin cannot suspend self");
    });

    it("suspending zero address is rejected", async function () {
      await expect(contract.connect(admin).setSuspended(ethers.ZeroAddress, true))
        .to.be.revertedWith("EWT: zero address");
    });

    it("non-admin cannot suspend accounts", async function () {
      await expect(contract.connect(unauthorized).setSuspended(producer.address, true))
        .to.be.revertedWith("EWT: caller lacks required role");
    });
  });

  describe("Device Registration (Producer)", function () {
    beforeEach(async function () {
      await contract.connect(producer).selfRegister(2);
    });

    it("producer registers device without specifying owner", async function () {
      const tx = await contract.connect(producer).registerDevice(1, DUMMY_HASH, "Manufactured");
      await expect(tx).to.emit(contract, "DeviceRegistered").withArgs(1, 1, producer.address, DUMMY_HASH);
      await expect(tx).to.emit(contract, "StatusChanged").withArgs(1, 0, producer.address, "Manufactured");

      const dev = await contract.getDevice(1);
      expect(dev.id).to.equal(1);
      expect(dev.category).to.equal(1);
      expect(dev.metaHash).to.equal(DUMMY_HASH);
      expect(dev.producer).to.equal(producer.address);
      expect(dev.owner).to.equal(ethers.ZeroAddress);
      expect(dev.status).to.equal(0); // Registered
      expect(await contract.deviceCount()).to.equal(1);
      expect(await contract.statusCount(0)).to.equal(1);
    });

    it("device IDs increment monotonically", async function () {
      await contract.connect(producer).registerDevice(1, DUMMY_HASH, "Dev 1");
      await contract.connect(producer).registerDevice(2, DUMMY_HASH2, "Dev 2");
      expect(await contract.deviceCount()).to.equal(2);
    });

    it("invalid category 0 or 8 reverts", async function () {
      await expect(contract.connect(producer).registerDevice(0, DUMMY_HASH, "bad"))
        .to.be.revertedWith("EWT: invalid category");
      await expect(contract.connect(producer).registerDevice(8, DUMMY_HASH, "bad"))
        .to.be.revertedWith("EWT: invalid category");
    });

    it("empty metadata hash reverts", async function () {
      await expect(contract.connect(producer).registerDevice(1, HASH_ZERO, "bad"))
        .to.be.revertedWith("EWT: empty metadata hash");
    });

    it("non-producer cannot register device", async function () {
      await expect(contract.connect(unauthorized).registerDevice(1, DUMMY_HASH, "hack"))
        .to.be.revertedWith("EWT: caller lacks required role");
    });
  });

  describe("Device Claiming (Consumer)", function () {
    beforeEach(async function () {
      await contract.connect(producer).selfRegister(2);
      await contract.connect(consumer).selfRegister(3);
      await contract.connect(consumer2).selfRegister(3);
      await contract.connect(producer).registerDevice(1, DUMMY_HASH, "Manufactured");
    });

    it("consumer successfully claims an unclaimed device", async function () {
      await expect(contract.connect(consumer).claimDevice(1, "Claimed by owner"))
        .to.emit(contract, "DeviceClaimed").withArgs(1, consumer.address);

      const dev = await contract.getDevice(1);
      expect(dev.owner).to.equal(consumer.address);
      expect(dev.custodian).to.equal(consumer.address);
    });

    it("claiming an already claimed device reverts", async function () {
      await contract.connect(consumer).claimDevice(1, "Claimed");
      await expect(contract.connect(consumer2).claimDevice(1, "Steal"))
        .to.be.revertedWith("EWT: already claimed");
    });

    it("non-consumer cannot claim a device", async function () {
      await expect(contract.connect(unauthorized).claimDevice(1, "Claim"))
        .to.be.revertedWith("EWT: caller lacks required role");
    });

    it("claiming an unknown device reverts", async function () {
      await expect(contract.connect(consumer).claimDevice(999, "Claim"))
        .to.be.revertedWith("EWT: unknown device");
    });

    it("claiming a device not in Registered status reverts", async function () {
      await contract.connect(consumer).claimDevice(1, "Claimed");
      await contract.connect(consumer).requestPickup(1, "Pickup");
      await expect(contract.connect(consumer2).claimDevice(1, "Claim"))
        .to.be.revertedWith("EWT: invalid state");
    });
  });

  describe("Full Lifecycle Transitions", function () {
    beforeEach(async function () {
      await contract.connect(producer).selfRegister(2);
      await contract.connect(consumer).selfRegister(3);
      await contract.connect(collector).selfRegister(4);
      await contract.connect(recycler).selfRegister(5);

      await contract.connect(producer).registerDevice(1, DUMMY_HASH, "Laptop");
      await contract.connect(consumer).claimDevice(1, "Registered owner");
    });

    it("full happy path: Registered -> Recycled with history and statusCount", async function () {
      // 1. PickupRequested
      await expect(contract.connect(consumer).requestPickup(1, "Pickup requested"))
        .to.emit(contract, "StatusChanged").withArgs(1, 1, consumer.address, "Pickup requested");
      expect((await contract.getDevice(1)).status).to.equal(1);
      expect(await contract.statusCount(1)).to.equal(1);

      // 2. Collected
      await expect(contract.connect(collector).confirmCollection(1, "Collected"))
        .to.emit(contract, "StatusChanged").withArgs(1, 2, collector.address, "Collected");
      const dev2 = await contract.getDevice(1);
      expect(dev2.status).to.equal(2);
      expect(dev2.custodian).to.equal(collector.address);

      // 3. InTransit
      await expect(contract.connect(collector).dispatchToRecycler(1, recycler.address, "Dispatched"))
        .to.emit(contract, "StatusChanged").withArgs(1, 3, collector.address, "Dispatched");
      const dev3 = await contract.getDevice(1);
      expect(dev3.status).to.equal(3);
      expect(dev3.pendingRecipient).to.equal(recycler.address);

      // 4. AtRecycler
      await expect(contract.connect(recycler).confirmReceipt(1, 2000, "Received & weighed"))
        .to.emit(contract, "StatusChanged").withArgs(1, 4, recycler.address, "Received & weighed");
      const dev4 = await contract.getDevice(1);
      expect(dev4.status).to.equal(4);
      expect(dev4.receivedGrams).to.equal(2000);
      expect(dev4.custodian).to.equal(recycler.address);
      expect(dev4.pendingRecipient).to.equal(ethers.ZeroAddress);

      // 5. Recycled
      await expect(contract.connect(recycler).completeRecycling(1, 1600, 400, CERT_HASH_1, "Recycled"))
        .to.emit(contract, "StatusChanged").withArgs(1, 5, recycler.address, "Recycled")
        .and.to.emit(contract, "CertificateAnchored").withArgs(1, CERT_HASH_1, recycler.address, 1600)
        .and.to.emit(contract, "PointsAwarded").withArgs(consumer.address, 1, 16);

      const dev5 = await contract.getDevice(1);
      expect(dev5.status).to.equal(5);
      expect(dev5.recoveredGrams).to.equal(1600);
      expect(dev5.residualGrams).to.equal(400);
      expect(dev5.certificateHash).to.equal(CERT_HASH_1);
      expect(await contract.totalRecoveredGrams()).to.equal(1600);
      expect(await contract.greenPoints(consumer.address)).to.equal(16);

      const hist = await contract.getHistory(1);
      expect(hist.length).to.equal(7); // Registered (producer), Claimed (consumer), Pickup, Collected, Dispatched, Received, Recycled
    });

    it("pickup cannot be requested without claiming first", async function () {
      await contract.connect(producer).registerDevice(1, DUMMY_HASH, "Dev 2");
      // Device 2 is unclaimed (owner is address(0))
      await expect(contract.connect(consumer).requestPickup(2, "Pickup"))
        .to.be.revertedWith("EWT: only the device owner");
    });

    it("only owner can request pickup", async function () {
      await expect(contract.connect(unauthorized).requestPickup(1, "Pickup"))
        .to.be.revertedWith("EWT: only the device owner");
    });

    it("confirmCollection before pickup request reverts", async function () {
      await expect(contract.connect(collector).confirmCollection(1, "Early collect"))
        .to.be.revertedWith("EWT: invalid state");
    });

    it("dispatch by non-custodian reverts", async function () {
      await contract.connect(consumer).requestPickup(1, "Pickup");
      await contract.connect(collector).confirmCollection(1, "Collected");
      await expect(contract.connect(unauthorized).dispatchToRecycler(1, recycler.address, "Dispatch"))
        .to.be.revertedWith("EWT: caller lacks required role");
    });

    it("dispatch to non-recycler reverts", async function () {
      await contract.connect(consumer).requestPickup(1, "Pickup");
      await contract.connect(collector).confirmCollection(1, "Collected");
      await expect(contract.connect(collector).dispatchToRecycler(1, unauthorized.address, "Dispatch"))
        .to.be.revertedWith("EWT: recipient is not a recycler");
    });

    it("confirmReceipt by non-designated recycler reverts", async function () {
      const [, , , , , , , otherRecycler] = await ethers.getSigners();
      await contract.connect(otherRecycler).selfRegister(5);

      await contract.connect(consumer).requestPickup(1, "Pickup");
      await contract.connect(collector).confirmCollection(1, "Collected");
      await contract.connect(collector).dispatchToRecycler(1, recycler.address, "Dispatch");

      await expect(contract.connect(otherRecycler).confirmReceipt(1, 1000, "Weighed"))
        .to.be.revertedWith("EWT: not the designated recycler");
    });

    it("confirmReceipt with zero weight reverts", async function () {
      await contract.connect(consumer).requestPickup(1, "Pickup");
      await contract.connect(collector).confirmCollection(1, "Collected");
      await contract.connect(collector).dispatchToRecycler(1, recycler.address, "Dispatch");

      await expect(contract.connect(recycler).confirmReceipt(1, 0, "Weighed"))
        .to.be.revertedWith("EWT: weight must be positive");
    });
  });

  describe("Recycling Validation & Certificate Anchoring", function () {
    beforeEach(async function () {
      await contract.connect(producer).selfRegister(2);
      await contract.connect(consumer).selfRegister(3);
      await contract.connect(collector).selfRegister(4);
      await contract.connect(recycler).selfRegister(5);

      await contract.connect(producer).registerDevice(1, DUMMY_HASH, "Phone");
      await contract.connect(consumer).claimDevice(1, "My phone");
      await contract.connect(consumer).requestPickup(1, "Pickup");
      await contract.connect(collector).confirmCollection(1, "Collected");
      await contract.connect(collector).dispatchToRecycler(1, recycler.address, "Dispatched");
      await contract.connect(recycler).confirmReceipt(1, 1000, "Received 1000g");
    });

    it("mass balance mismatch reverts", async function () {
      // 800 + 100 = 900 != 1000
      await expect(contract.connect(recycler).completeRecycling(1, 800, 100, CERT_HASH_1, "Done"))
        .to.be.revertedWith("EWT: mass balance mismatch");
    });

    it("empty certificate hash reverts", async function () {
      await expect(contract.connect(recycler).completeRecycling(1, 800, 200, HASH_ZERO, "Done"))
        .to.be.revertedWith("EWT: certificate hash required");
    });

    it("duplicate certificate hash is rejected", async function () {
      // Device 1 recycling succeeds
      await contract.connect(recycler).completeRecycling(1, 800, 200, CERT_HASH_1, "Done");

      // Device 2
      await contract.connect(producer).registerDevice(1, DUMMY_HASH2, "Tablet");
      await contract.connect(consumer).claimDevice(2, "My tablet");
      await contract.connect(consumer).requestPickup(2, "Pickup");
      await contract.connect(collector).confirmCollection(2, "Collected");
      await contract.connect(collector).dispatchToRecycler(2, recycler.address, "Dispatched");
      await contract.connect(recycler).confirmReceipt(2, 500, "Weighed");

      // Attempting to reuse CERT_HASH_1 for Device 2 must revert
      await expect(contract.connect(recycler).completeRecycling(2, 400, 100, CERT_HASH_1, "Reuse cert"))
        .to.be.revertedWith("EWT: certificate already used");
    });

    it("certificateDevice maps certificate hash to device id", async function () {
      await contract.connect(recycler).completeRecycling(1, 800, 200, CERT_HASH_1, "Done");
      expect(await contract.certificateDevice(CERT_HASH_1)).to.equal(1);
      expect(await contract.certificateDevice(CERT_HASH_2)).to.equal(0);
    });

    it("verifyCertificate returns true only for exact certificate hash after recycling", async function () {
      expect(await contract.verifyCertificate(1, CERT_HASH_1)).to.be.false;
      await contract.connect(recycler).completeRecycling(1, 800, 200, CERT_HASH_1, "Done");
      expect(await contract.verifyCertificate(1, CERT_HASH_1)).to.be.true;
      expect(await contract.verifyCertificate(1, CERT_HASH_2)).to.be.false;
    });

    it("verifyMetadata matches only the registered hash", async function () {
      expect(await contract.verifyMetadata(1, DUMMY_HASH)).to.be.true;
      expect(await contract.verifyMetadata(1, DUMMY_HASH2)).to.be.false;
    });
  });

  describe("Green Points & Redemption", function () {
    beforeEach(async function () {
      await contract.connect(producer).selfRegister(2);
      await contract.connect(consumer).selfRegister(3);
      await contract.connect(collector).selfRegister(4);
      await contract.connect(recycler).selfRegister(5);

      await contract.connect(producer).registerDevice(1, DUMMY_HASH, "Desktop");
      await contract.connect(consumer).claimDevice(1, "Owner");
      await contract.connect(consumer).requestPickup(1, "Pickup");
      await contract.connect(collector).confirmCollection(1, "Collected");
      await contract.connect(collector).dispatchToRecycler(1, recycler.address, "Dispatched");
      await contract.connect(recycler).confirmReceipt(1, 3000, "Weighed");
      // Recover 2500g -> 25 points
      await contract.connect(recycler).completeRecycling(1, 2500, 500, CERT_HASH_1, "Recycled");
    });

    it("consumer successfully redeems points with active producer", async function () {
      expect(await contract.greenPoints(consumer.address)).to.equal(25);

      await expect(contract.connect(consumer).redeemPoints(10, producer.address, "Discount voucher"))
        .to.emit(contract, "PointsRedeemed")
        .withArgs(consumer.address, producer.address, 10, "Discount voucher");

      expect(await contract.greenPoints(consumer.address)).to.equal(15);
      expect(await contract.pointsRedeemedWith(producer.address)).to.equal(10);
      expect(await contract.totalPointsRedeemed()).to.equal(10);
    });

    it("redeeming more points than balance reverts", async function () {
      await expect(contract.connect(consumer).redeemPoints(30, producer.address, "Overspend"))
        .to.be.revertedWith("EWT: insufficient points");
    });

    it("redeeming zero points reverts", async function () {
      await expect(contract.connect(consumer).redeemPoints(0, producer.address, "Zero"))
        .to.be.revertedWith("EWT: points must be positive");
    });

    it("redeeming points with a non-producer reverts", async function () {
      await expect(contract.connect(consumer).redeemPoints(5, unauthorized.address, "Voucher"))
        .to.be.revertedWith("EWT: not an active producer");
    });

    it("redeeming points with a suspended producer reverts", async function () {
      await contract.connect(admin).setSuspended(producer.address, true);
      await expect(contract.connect(consumer).redeemPoints(5, producer.address, "Voucher"))
        .to.be.revertedWith("EWT: not an active producer");
    });

    it("non-consumer cannot redeem points", async function () {
      await expect(contract.connect(unauthorized).redeemPoints(5, producer.address, "Voucher"))
        .to.be.revertedWith("EWT: caller lacks required role");
    });
  });

  describe("Pause Mechanism", function () {
    it("admin pauses system and operations revert", async function () {
      await contract.connect(producer).selfRegister(2);
      await expect(contract.connect(admin).setPaused(true))
        .to.emit(contract, "PausedStateChanged").withArgs(true, admin.address);
      expect(await contract.paused()).to.be.true;

      await expect(contract.connect(producer).registerDevice(1, DUMMY_HASH, "Dev"))
        .to.be.revertedWith("EWT: system paused");
    });

    it("unpausing restores operations", async function () {
      await contract.connect(producer).selfRegister(2);
      await contract.connect(admin).setPaused(true);
      await contract.connect(admin).setPaused(false);
      expect(await contract.paused()).to.be.false;

      await expect(contract.connect(producer).registerDevice(1, DUMMY_HASH, "Dev"))
        .to.emit(contract, "DeviceRegistered");
    });

    it("non-admin cannot pause system", async function () {
      await expect(contract.connect(unauthorized).setPaused(true))
        .to.be.revertedWith("EWT: caller lacks required role");
    });
  });
});
