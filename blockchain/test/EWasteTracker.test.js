const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const Role = { None: 0, Admin: 1, Producer: 2, Consumer: 3, Collector: 4, Recycler: 5 };
const Status = { Registered: 0, PickupRequested: 1, Collected: 2, InTransit: 3, AtRecycler: 4, Recycled: 5 };
const META = ethers.sha256(ethers.toUtf8Bytes("device-metadata"));
const CERT = ethers.sha256(ethers.toUtf8Bytes("certificate-pdf-bytes"));
const OTHER = ethers.sha256(ethers.toUtf8Bytes("tampered-file"));

async function deployFixture() {
  const [admin, producer, consumer, collector, recycler, outsider, consumer2, collector2, recycler2] =
    await ethers.getSigners();
  const factory = await ethers.getContractFactory("EWasteTracker");
  const c = await factory.deploy();
  await c.waitForDeployment();
  await c.assignRole(producer.address, Role.Producer);
  await c.assignRole(consumer.address, Role.Consumer);
  await c.assignRole(consumer2.address, Role.Consumer);
  await c.assignRole(collector.address, Role.Collector);
  await c.assignRole(collector2.address, Role.Collector);
  await c.assignRole(recycler.address, Role.Recycler);
  await c.assignRole(recycler2.address, Role.Recycler);
  return { c, admin, producer, consumer, consumer2, collector, collector2, recycler, recycler2, outsider };
}

// Registers device #1 and moves it to the requested stage (0..5)
async function toStage(f, stage) {
  const { c, producer, consumer, collector, recycler } = f;
  await c.connect(producer).registerDevice(1, META, consumer.address, "registered");
  if (stage >= 1) await c.connect(consumer).requestPickup(1, "pickup requested");
  if (stage >= 2) await c.connect(collector).confirmCollection(1, "collected");
  if (stage >= 3) await c.connect(collector).dispatchToRecycler(1, recycler.address, "dispatched");
  if (stage >= 4) await c.connect(recycler).confirmReceipt(1, 2000, "received");
  if (stage >= 5) await c.connect(recycler).completeRecycling(1, 1500, 500, CERT, "recycled");
}

describe("EWasteTracker", function () {
  describe("Roles", function () {
    it("deployer is admin", async function () {
      const { c, admin } = await loadFixture(deployFixture);
      expect(await c.admin()).to.equal(admin.address);
      expect(await c.roles(admin.address)).to.equal(Role.Admin);
    });
    it("admin can assign a role and event is emitted", async function () {
      const { c, outsider } = await loadFixture(deployFixture);
      await expect(c.assignRole(outsider.address, Role.Consumer))
        .to.emit(c, "RoleAssigned").withArgs(outsider.address, Role.Consumer);
    });
    it("non-admin cannot assign roles", async function () {
      const { c, outsider } = await loadFixture(deployFixture);
      await expect(c.connect(outsider).assignRole(outsider.address, Role.Admin))
        .to.be.revertedWith("EWT: caller lacks required role");
    });
    it("zero address is rejected", async function () {
      const { c } = await loadFixture(deployFixture);
      await expect(c.assignRole(ethers.ZeroAddress, Role.Consumer)).to.be.revertedWith("EWT: zero address");
    });
    it("admin cannot change own role", async function () {
      const { c, admin } = await loadFixture(deployFixture);
      await expect(c.assignRole(admin.address, Role.None)).to.be.revertedWith("EWT: admin cannot change own role");
    });
  });

  describe("Registration", function () {
    it("producer registers a device and event is emitted", async function () {
      const { c, producer, consumer } = await loadFixture(deployFixture);
      await expect(c.connect(producer).registerDevice(1, META, consumer.address, "reg"))
        .to.emit(c, "DeviceRegistered").withArgs(1, 1, consumer.address, producer.address, META);
      const d = await c.getDevice(1);
      expect(d.status).to.equal(Status.Registered);
      expect(d.owner).to.equal(consumer.address);
    });
    it("non-producer cannot register", async function () {
      const { c, outsider, consumer } = await loadFixture(deployFixture);
      await expect(c.connect(outsider).registerDevice(1, META, consumer.address, "x"))
        .to.be.revertedWith("EWT: caller lacks required role");
    });
    it("invalid category is rejected (0 and 8)", async function () {
      const { c, producer, consumer } = await loadFixture(deployFixture);
      await expect(c.connect(producer).registerDevice(0, META, consumer.address, "x")).to.be.revertedWith("EWT: invalid category");
      await expect(c.connect(producer).registerDevice(8, META, consumer.address, "x")).to.be.revertedWith("EWT: invalid category");
    });
    it("empty metadata hash is rejected", async function () {
      const { c, producer, consumer } = await loadFixture(deployFixture);
      await expect(c.connect(producer).registerDevice(1, ethers.ZeroHash, consumer.address, "x"))
        .to.be.revertedWith("EWT: empty metadata hash");
    });
    it("owner must be a registered consumer", async function () {
      const { c, producer, outsider } = await loadFixture(deployFixture);
      await expect(c.connect(producer).registerDevice(1, META, outsider.address, "x"))
        .to.be.revertedWith("EWT: owner must be a registered consumer");
    });
    it("device IDs increment", async function () {
      const { c, producer, consumer } = await loadFixture(deployFixture);
      await c.connect(producer).registerDevice(1, META, consumer.address, "a");
      await c.connect(producer).registerDevice(2, META, consumer.address, "b");
      expect(await c.deviceCount()).to.equal(2);
      expect((await c.getDevice(2)).id).to.equal(2);
    });
  });

  describe("Lifecycle", function () {
    it("full happy path ends in Recycled with 6 history entries", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 5);
      expect((await f.c.getDevice(1)).status).to.equal(Status.Recycled);
      expect((await f.c.getHistory(1)).length).to.equal(6);
    });
    it("only the owner can request pickup", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 0);
      await expect(f.c.connect(f.consumer2).requestPickup(1, "x")).to.be.revertedWith("EWT: only the device owner");
    });
    it("collection before pickup request is rejected", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 0);
      await expect(f.c.connect(f.collector).confirmCollection(1, "x")).to.be.revertedWith("EWT: invalid state");
    });
    it("dispatch only by the current custodian", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 2);
      await expect(f.c.connect(f.collector2).dispatchToRecycler(1, f.recycler.address, "x"))
        .to.be.revertedWith("EWT: not the custodian");
    });
    it("dispatch to a non-recycler is rejected", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 2);
      await expect(f.c.connect(f.collector).dispatchToRecycler(1, f.consumer2.address, "x"))
        .to.be.revertedWith("EWT: recipient is not a recycler");
    });
    it("only the designated recycler can confirm receipt", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 3);
      await expect(f.c.connect(f.recycler2).confirmReceipt(1, 2000, "x"))
        .to.be.revertedWith("EWT: not the designated recycler");
    });
    it("skipping a stage is rejected", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 0);
      await expect(f.c.connect(f.recycler).completeRecycling(1, 1, 1, CERT, "x")).to.be.revertedWith("EWT: invalid state");
    });
    it("zero received weight is rejected", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 3);
      await expect(f.c.connect(f.recycler).confirmReceipt(1, 0, "x")).to.be.revertedWith("EWT: weight must be positive");
    });
    it("unknown device ID is rejected", async function () {
      const { c } = await loadFixture(deployFixture);
      await expect(c.getDevice(99)).to.be.revertedWith("EWT: unknown device");
    });
  });

  describe("Recycling", function () {
    it("mass balance mismatch is rejected", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 4);
      await expect(f.c.connect(f.recycler).completeRecycling(1, 1500, 400, CERT, "x"))
        .to.be.revertedWith("EWT: mass balance mismatch");
    });
    it("exact mass balance is accepted and totals update", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 5);
      const d = await f.c.getDevice(1);
      expect(d.recoveredGrams).to.equal(1500);
      expect(d.residualGrams).to.equal(500);
      expect(await f.c.totalRecoveredGrams()).to.equal(1500);
    });
    it("certificate hash is required", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 4);
      await expect(f.c.connect(f.recycler).completeRecycling(1, 1500, 500, ethers.ZeroHash, "x"))
        .to.be.revertedWith("EWT: certificate hash required");
    });
    it("Green Points equal recovered grams / 100", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 5);
      expect(await f.c.greenPoints(f.consumer.address)).to.equal(15);
    });
    it("verifyCertificate is true only for the right hash after recycling", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 4);
      expect(await f.c.verifyCertificate(1, CERT)).to.equal(false);
      await f.c.connect(f.recycler).completeRecycling(1, 1500, 500, CERT, "done");
      expect(await f.c.verifyCertificate(1, CERT)).to.equal(true);
      expect(await f.c.verifyCertificate(1, OTHER)).to.equal(false);
    });
    it("history records the correct actors in order", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 5);
      const h = await f.c.getHistory(1);
      expect(h[0].actor).to.equal(f.producer.address);
      expect(h[1].actor).to.equal(f.consumer.address);
      expect(h[2].actor).to.equal(f.collector.address);
      expect(h[5].actor).to.equal(f.recycler.address);
      expect(h[5].status).to.equal(Status.Recycled);
    });
    it("statusCount tracks transitions", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 5);
      expect(await f.c.statusCount(Status.Recycled)).to.equal(1);
      expect(await f.c.statusCount(Status.Registered)).to.equal(0);
    });
    it("verifyMetadata matches only the registered hash", async function () {
      const f = await loadFixture(deployFixture);
      await toStage(f, 0);
      expect(await f.c.verifyMetadata(1, META)).to.equal(true);
      expect(await f.c.verifyMetadata(1, OTHER)).to.equal(false);
    });
  });

  describe("Pause", function () {
    it("admin pauses and registration reverts", async function () {
      const { c, producer, consumer } = await loadFixture(deployFixture);
      await c.setPaused(true);
      await expect(c.connect(producer).registerDevice(1, META, consumer.address, "x"))
        .to.be.revertedWith("EWT: system paused");
    });
    it("unpausing restores operation", async function () {
      const { c, producer, consumer } = await loadFixture(deployFixture);
      await c.setPaused(true);
      await c.setPaused(false);
      await expect(c.connect(producer).registerDevice(1, META, consumer.address, "x")).to.not.be.reverted;
    });
    it("non-admin cannot pause", async function () {
      const { c, outsider } = await loadFixture(deployFixture);
      await expect(c.connect(outsider).setPaused(true)).to.be.revertedWith("EWT: caller lacks required role");
    });
  });
});
