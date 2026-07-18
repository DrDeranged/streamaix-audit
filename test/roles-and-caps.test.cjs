const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time, loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
const RESOLVER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RESOLVER_ROLE"));
const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;

describe("AccessControl role model + mint caps", function () {
  async function deployFixture() {
    const [deployer, service, multisig, user, other] = await ethers.getSigners();

    const StreamToken = await ethers.getContractFactory("StreamToken");
    const token = await StreamToken.deploy(deployer.address);

    const SummaryNFT = await ethers.getContractFactory("SummaryNFT");
    const nft = await SummaryNFT.deploy(deployer.address);

    const ConditionalTokens = await ethers.getContractFactory("ConditionalTokens");
    const conditionalTokens = await ConditionalTokens.deploy(deployer.address);

    const Factory = await ethers.getContractFactory("PredictionMarketFactory");
    const factory = await Factory.deploy(
      await conditionalTokens.getAddress(),
      await token.getAddress(),
      deployer.address
    );

    await token.grantRole(MINTER_ROLE, service.address);
    await nft.grantRole(MINTER_ROLE, service.address);
    await factory.grantRole(RESOLVER_ROLE, service.address);

    return { token, nft, factory, conditionalTokens, deployer, service, multisig, user, other };
  }

  describe("StreamToken minting", function () {
    it("reverts when a non-minter mints", async function () {
      const { token, user } = await loadFixture(deployFixture);
      await expect(token.connect(user).mint(user.address, 1n)).to.be.revertedWithCustomError(
        token,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("admin without MINTER_ROLE cannot mint", async function () {
      const { token, deployer } = await loadFixture(deployFixture);
      await expect(token.connect(deployer).mint(deployer.address, 1n)).to.be.revertedWithCustomError(
        token,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("reverts when a single mint exceeds maxMintPerTx", async function () {
      const { token, service, user } = await loadFixture(deployFixture);
      const cap = await token.maxMintPerTx();
      await expect(token.connect(service).mint(user.address, cap + 1n)).to.be.revertedWith(
        "Exceeds per-tx mint cap"
      );
      await expect(token.connect(service).mint(user.address, cap)).to.not.be.reverted;
    });

    it("enforces the daily cap and resets it after a day", async function () {
      const { token, deployer, service, user } = await loadFixture(deployFixture);
      // Tighten caps for the test: 100 per tx, 150 per day.
      await token.connect(deployer).setMaxMintPerTx(100n);
      await token.connect(deployer).setMaxMintPerDay(150n);

      await token.connect(service).mint(user.address, 100n);
      await expect(token.connect(service).mint(user.address, 100n)).to.be.revertedWith(
        "Exceeds daily mint cap"
      );
      await token.connect(service).mint(user.address, 50n); // exactly at the cap
      expect(await token.mintedLast24h()).to.equal(150n);
      await expect(token.connect(service).mint(user.address, 1n)).to.be.revertedWith(
        "Exceeds daily mint cap"
      );

      // 24 hours later: window has fully rolled over.
      await time.increase(24 * 60 * 60);
      expect(await token.mintedLast24h()).to.equal(0n);
      await expect(token.connect(service).mint(user.address, 100n)).to.not.be.reverted;
    });

    it("uses a true rolling 24h window, not a calendar day", async function () {
      const { token, deployer, service, user } = await loadFixture(deployFixture);
      await token.connect(deployer).setMaxMintPerTx(100n);
      await token.connect(deployer).setMaxMintPerDay(150n);

      await token.connect(service).mint(user.address, 100n);

      // 12 hours later the first mint is still inside the window: only 50 headroom.
      await time.increase(12 * 60 * 60);
      await expect(token.connect(service).mint(user.address, 51n)).to.be.revertedWith(
        "Exceeds daily mint cap"
      );
      await token.connect(service).mint(user.address, 50n);

      // 13 more hours: the first 100 has rolled out, the 50 is still counted.
      await time.increase(13 * 60 * 60);
      await expect(token.connect(service).mint(user.address, 100n)).to.not.be.reverted;
      await expect(token.connect(service).mint(user.address, 1n)).to.be.revertedWith(
        "Exceeds daily mint cap"
      );
    });

    it("only admin can change caps, and cap changes emit events", async function () {
      const { token, deployer, service } = await loadFixture(deployFixture);
      await expect(token.connect(service).setMaxMintPerTx(1n)).to.be.revertedWithCustomError(
        token,
        "AccessControlUnauthorizedAccount"
      );
      const oldTx = await token.maxMintPerTx();
      await expect(token.connect(deployer).setMaxMintPerTx(42n))
        .to.emit(token, "MaxMintPerTxUpdated")
        .withArgs(oldTx, 42n);
      const oldDay = await token.maxMintPerDay();
      await expect(token.connect(deployer).setMaxMintPerDay(43n))
        .to.emit(token, "MaxMintPerDayUpdated")
        .withArgs(oldDay, 43n);
    });

    it("pause blocks mint and transfer; unpause restores them", async function () {
      const { token, deployer, service, user } = await loadFixture(deployFixture);
      await expect(token.connect(service).pause()).to.be.revertedWithCustomError(
        token,
        "AccessControlUnauthorizedAccount"
      );
      await token.connect(deployer).pause();
      await expect(token.connect(service).mint(user.address, 1n)).to.be.revertedWithCustomError(
        token,
        "EnforcedPause"
      );
      await expect(token.connect(deployer).transfer(user.address, 1n)).to.be.revertedWithCustomError(
        token,
        "EnforcedPause"
      );
      await token.connect(deployer).unpause();
      await expect(token.connect(deployer).transfer(user.address, 1n)).to.not.be.reverted;
      await expect(token.connect(service).mint(user.address, 1n)).to.not.be.reverted;
    });
  });

  describe("SummaryNFT minting", function () {
    it("reverts when a non-minter mints", async function () {
      const { nft, user } = await loadFixture(deployFixture);
      await expect(
        nft.connect(user).mintSummaryNFT(user.address, "hash", "ar")
      ).to.be.revertedWithCustomError(nft, "AccessControlUnauthorizedAccount");
    });

    it("minter can mint; pause blocks mint and transfer", async function () {
      const { nft, deployer, service, user, other } = await loadFixture(deployFixture);
      await nft.connect(service).mintSummaryNFT(user.address, "hash1", "ar1");
      expect(await nft.ownerOf(0)).to.equal(user.address);

      await nft.connect(deployer).pause();
      await expect(
        nft.connect(service).mintSummaryNFT(user.address, "hash2", "ar2")
      ).to.be.revertedWithCustomError(nft, "EnforcedPause");
      await expect(
        nft.connect(user).transferFrom(user.address, other.address, 0)
      ).to.be.revertedWithCustomError(nft, "EnforcedPause");

      await nft.connect(deployer).unpause();
      await expect(nft.connect(user).transferFrom(user.address, other.address, 0)).to.not.be.reverted;
    });
  });

  describe("PredictionMarketFactory resolution", function () {
    it("non-resolver cannot resolve; admin can rotate the resolver", async function () {
      const { factory, deployer, service, other } = await loadFixture(deployFixture);
      await expect(factory.connect(other).resolveMarket(0, 1)).to.be.revertedWithCustomError(
        factory,
        "AccessControlUnauthorizedAccount"
      );

      await expect(factory.connect(other).rotateResolver(service.address, other.address))
        .to.be.revertedWithCustomError(factory, "AccessControlUnauthorizedAccount");

      await expect(factory.connect(deployer).rotateResolver(service.address, other.address))
        .to.emit(factory, "ResolverRotated")
        .withArgs(service.address, other.address);
      expect(await factory.hasRole(RESOLVER_ROLE, service.address)).to.equal(false);
      expect(await factory.hasRole(RESOLVER_ROLE, other.address)).to.equal(true);

      // Old resolver now rejected at the role gate.
      await expect(factory.connect(service).resolveMarket(0, 1)).to.be.revertedWithCustomError(
        factory,
        "AccessControlUnauthorizedAccount"
      );
    });
  });

  describe("Admin handoff", function () {
    it("transfers admin to multisig and deployer ends with no roles", async function () {
      const { token, nft, factory, deployer, multisig } = await loadFixture(deployFixture);

      for (const contract of [token, nft, factory]) {
        await contract.connect(deployer).grantRole(DEFAULT_ADMIN_ROLE, multisig.address);
        await contract.connect(deployer).renounceRole(DEFAULT_ADMIN_ROLE, deployer.address);

        expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, multisig.address)).to.equal(true);
        expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)).to.equal(false);
        expect(await contract.hasRole(MINTER_ROLE, deployer.address)).to.equal(false);
        expect(await contract.hasRole(RESOLVER_ROLE, deployer.address)).to.equal(false);
      }

      // Old admin is powerless; new admin governs.
      await expect(token.connect(deployer).setMaxMintPerTx(1n)).to.be.revertedWithCustomError(
        token,
        "AccessControlUnauthorizedAccount"
      );
      await expect(token.connect(multisig).setMaxMintPerTx(1n)).to.not.be.reverted;
      await expect(token.connect(multisig).pause()).to.not.be.reverted;
    });
  });
});
