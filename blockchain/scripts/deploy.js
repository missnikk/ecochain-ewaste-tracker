const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [admin] = await hre.ethers.getSigners();

  const Factory = await hre.ethers.getContractFactory("EWasteTracker");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  const receipt = await contract.deploymentTransaction().wait();

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
  console.log("EWasteTracker v2 deployed to:", address);
  console.log("Admin:", admin.address);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
