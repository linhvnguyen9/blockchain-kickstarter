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
    });
});