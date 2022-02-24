const CampaignFactory = artifacts.require("CampaignFactory.sol");
const Campaign = artifacts.require("Campaign.sol");

contract("CampaignFactory", accounts => {
    var campaignFactory;

    before(async() => {
        campaignFactory = await CampaignFactory.deployed();
    });

    describe("Deploy campaign factory", async() => {
        it("deploy", async () => {
            assert.ok(campaignFactory.address);
        });
    });

    describe("Create campaign", async() => {
        before(async() => {
            await campaignFactory.createCampaign("100");
        });

        it("New campaign's address is saved", async () => {
            let deployedCampaignAddress = await campaignFactory.deployedCampaign(0);
            assert.ok(deployedCampaignAddress);
        });

        it("Created campaign's manager is sender", async () => {
            let deployedCampaignAddress = await campaignFactory.deployedCampaign(0);
            let deployedCampaign = await Campaign.at(deployedCampaignAddress);
            let manager = await deployedCampaign.manager();
            assert.equal(manager, accounts[0]);
        });

        it("Minimum contribution is saved", async () => {
            let deployedCampaignAddress = await campaignFactory.deployedCampaign(0);
            let deployedCampaign = await Campaign.at(deployedCampaignAddress);
            let minimumContribution = await deployedCampaign.minimumContribution();
            assert.equal(minimumContribution, "100");
        });
    });

    describe("Donate to campaign", async() => {
        var deployedCampaign;
        before(async() => {
            await campaignFactory.createCampaign("100");
            let deployedCampaignAddress = await campaignFactory.deployedCampaign(0);
            deployedCampaign = await Campaign.at(deployedCampaignAddress);
        });

        it("Contribution equals minimum returns error", async () => {
            try {
                await deployedCampaign.contribute({value: "100"});
                assert(false);
            } catch (err) {
                assert(err);
            }
        });

        it("Contribution greater than minimum is saved", async () => {
            await deployedCampaign.contribute({ from: accounts[1], value: "101"});
            
            let contributorStatus = await deployedCampaign.approvers(accounts[1]);
            assert(contributorStatus);

            let campaignBalance = await web3.eth.getBalance(deployedCampaign.address);
            assert.equal(campaignBalance, "101");
        });
    });

    describe("Making request", async() => {
        var deployedCampaign;
        before(async() => {
            await campaignFactory.createCampaign("100");
            let deployedCampaignAddress = await campaignFactory.deployedCampaign(0);
            deployedCampaign = await Campaign.at(deployedCampaignAddress);
        });

        it("Make a payment request from an account that's not manager returns error", async () => {
            try {
                await deployedCampaign.createRequest("Hello World", "100", accounts[2], {from: accounts[1]});
                assert(false);
            } catch (err) {
                assert(err);
            }
        });

        it("Make a payment request from manager", async () => {
            await deployedCampaign.createRequest("Hello World", "100", accounts[2], {from: accounts[0]});
            let request = await deployedCampaign.requests(0);
            let description = request.description;
            let value = request.value;
            let recipient = request.recipient;
            let isComplete = request.isComplete;
            let approvalCount = request.approvalCount;
            assert.equal(description, "Hello World");
            assert.equal(value, "100");
            assert.equal(recipient, accounts[2]);
            assert.equal(isComplete, false);
            assert.equal(approvalCount, 0);
        });
    });

    describe("Process request", async() => {
        var deployedCampaign;
        before(async() => {
            await campaignFactory.createCampaign("100");
            let deployedCampaignAddress = await campaignFactory.deployedCampaign(0);
            deployedCampaign = await Campaign.at(deployedCampaignAddress);
            await deployedCampaign.createRequest("Hello World", "100", accounts[2], {from: accounts[0]});
        });

        it("Finalize request by account not manager", async () => {
            try {
                await deployedCampaign.finalizeRequest(0, {from: accounts[1]});
                assert(false);
            } catch (err) {
                assert(err);
            }
        });

        it("Finalize request that has no approval", async () => {
            try {
                await deployedCampaign.finalizeRequest(0, {from: accounts[0]});
                assert(false);
            } catch (err) {
                assert(err);
            }
        });

        it("Approve request", async () => {
            await deployedCampaign.contribute({ from: accounts[1], value: "101"});
            await deployedCampaign.approveRequest(0, { from: accounts[1]});

            let contributorStatus = await deployedCampaign.approvers(accounts[1]);
            assert(contributorStatus);

            let request = await deployedCampaign.requests(0);

            assert.equal(request.approvalCount, 1);
        });

        it("Reapprove approved request throws error", async () => {
            try {
                await deployedCampaign.approveRequest(0, {from: accounts[1]});
                assert(false);
            } catch (err) {
                assert(err);
            }
        });

        it("Finalize request by manager", async () => {
            await deployedCampaign.contribute({ from: accounts[3], value: "101"});
            await deployedCampaign.approveRequest(0, { from: accounts[3]});

            let contractBalanceBeforeFinalizeString = await web3.eth.getBalance(deployedCampaign.address);
            let contractBalanceBeforeFinalize = new web3.utils.BN(contractBalanceBeforeFinalizeString, 10);

            await deployedCampaign.finalizeRequest(0, {from: accounts[0]});

            let contractBalanceAfterFinalizeString = await web3.eth.getBalance(deployedCampaign.address);
            let contractBalanceAfterFinalize = new web3.utils.BN(contractBalanceAfterFinalizeString, 10);
            
            let request = await deployedCampaign.requests(0);
            
            assert.equal(contractBalanceAfterFinalize.toString(), contractBalanceBeforeFinalize.subn(100).toString());
            assert(request.isComplete);
        });

        it("Finalize already completed request", async () => {
            try {
                await deployedCampaign.finalizeRequest(0, {from: accounts[0]});
                assert(false);
            } catch (err) {
                assert(err);
            }
        });
    });
});