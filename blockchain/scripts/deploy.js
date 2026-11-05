const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const signers = await hre.ethers.getSigners();
  // 0 admin, 1 producer, 2 consumer A, 3 collector, 4 recycler, 5 unauthorized, 6 consumer B
  const [admin, producer, consumer, collector, recycler, , consumer2] = signers;

  const Factory = await hre.ethers.getContractFactory("EWasteTracker");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  const receipt = await contract.deploymentTransaction().wait();

  // Role enum: Producer 2, Consumer 3, Collector 4, Recycler 5
  await (await contract.assignRole(producer.address, 2)).wait();
  await (await contract.assignRole(consumer.address, 3)).wait();
  await (await contract.assignRole(consumer2.address, 3)).wait();
  await (await contract.assignRole(collector.address, 4)).wait();
  await (await contract.assignRole(recycler.address, 5)).wait();

  const artifact = await hre.artifacts.readArtifact("EWasteTracker");
  const network = await hre.ethers.provider.getNetwork();
  const data = {
    address,
    abi: artifact.abi,
    chainId: Number(network.chainId),
    deployBlock: receipt.blockNumber,
  };

  for (const rel of ["../../frontend/src/contracts", "../../backend/src"]) {
    const dir = path.join(__dirname, rel);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "contractData.json"), JSON.stringify(data, null, 2));
  }
  console.log("EWasteTracker deployed to:", address);
  console.log("Admin:", admin.address);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
