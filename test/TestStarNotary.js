const StarNotary = artifacts.require("StarNotary");

var accounts;
var owner;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

it('can Create a Star', async () => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]})
    assert.equal(await instance.lookUptokenIdToStarInfo.call(tokenId), 'Awesome Star!')
});

it('lets user1 put up their star for sale', async () => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async () => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    await instance.buyStar(starId, {from: user2, value: balance});
    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);
});

it('lets user2 buy a star, if it is put up for sale', async () => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance});
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async () => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance, gasPrice: 0});
    const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
    let value = Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
    assert.equal(value, starPrice);
});

// Implement Task 2 Add supporting unit tests
describe('TestStarNotary contract', async () => {
    let instance;
    beforeEach(async () => {
        instance = await StarNotary.deployed(); // Making sure the Smart Contract is deployed and getting the instance.
    });

    it('can add the star name and star symbol properly', async () => {
        // 1. create a Star with different tokenId
        let user1 = accounts[1];
        let starId = 6;
        let name = 'awesome star A';
        await instance.createStar(name, starId, {from: user1});

        //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
        let newName = await instance.name();
        let newSymbol = await instance.symbol();
        assert.equal(newName, 'VV\'s StarNotaryToken');
        assert.equal(newSymbol, 'VST');
    });

    it('lets 2 users exchange stars', async () => {
        // 1. create 2 Stars with different tokenId
        let user1 = accounts[1];
        let user2 = accounts[2];
        let user3 = accounts[3];
        let starIdA = 7;
        let starIdB = 8;
        let nameA = 'awesome star A';
        let nameB = 'awesome star B';
        await instance.createStar(nameA, starIdA, {from: user1});
        await instance.createStar(nameB, starIdB, {from: user2});
        // 2. Call the exchangeStars functions implemented in the Smart Contract

        let errorNoUser = false;
        try {
            await instance.exchangeStars(starIdA, starIdB, {from: user3});
        } catch (e) {
            errorNoUser = true;
        }
        // No change
        let t1o1 = await instance.ownerOf(starIdA);
        let t1o2 = await instance.ownerOf(starIdB);
        // change
        await instance.exchangeStars(starIdA, starIdB, {from: user1});
        let t2o1 = await instance.ownerOf(starIdA);
        let t2o2 = await instance.ownerOf(starIdB);
        // change again
        await instance.exchangeStars(starIdA, starIdB, {from: user2});
        let t3o1 = await instance.ownerOf(starIdA);
        let t3o2 = await instance.ownerOf(starIdB);

        // 3. Verify that the owners changed
        assert(errorNoUser);
        assert.equal(user1, t1o1);
        assert.equal(user2, t1o2);
        assert.equal(user2, t2o1);
        assert.equal(user1, t2o2);
        assert.equal(user1, t3o1);
        assert.equal(user2, t3o2);

    });

    it('lets a user transfer a star', async () => {
        // 1. create a Star with different tokenId
        let user1 = accounts[1];
        let user2 = accounts[2];
        let starId = 9;
        let name = 'awesome star A';
        await instance.createStar(name, starId, {from: user1});
        let oldOwner = await instance.ownerOf(starId);

        // 2. use the transferStar function implemented in the Smart Contract
        await instance.transferStar(user2, starId, {from: user1});

        // 3. Verify the star owner changed.
        assert.equal(user1, oldOwner);
        assert.equal(user2, await instance.ownerOf(starId));
    });

    it('lookUptokenIdToStarInfo test', async () => {
        // 1. create a Star with different tokenId
        let user1 = accounts[1];
        let starId = 10;
        let name = 'awesome star A';
        await instance.createStar(name, starId, {from: user1});

        // 2. Call your method lookUptokenIdToStarInfo
        let newName = await instance.lookUptokenIdToStarInfo(starId, {from: user1});

        // 3. Verify if you Star name is the same
        assert.equal(newName, name);
    });
});