// Switch these lines once there are useful utils
// const testUtils = require('./utils');
require('./utils');

// Thing we are testing
const gatsbyNode = require('../gatsby-node');
const GhostAPI = require('../api');

describe('Basic Functionality ', function () {
    afterEach(() => {
        sinon.restore();
    });

    it('Gatsby Node does roughly the right thing', function (done) {
        const createNode = sinon.stub();

        // Pass in some fake data
        sinon.stub(GhostAPI, 'fetchAllPosts').resolves([
            {slug: 'welcome-to-ghost', page: false, tags: [
                {slug: 'getting-started'},
                {slug: 'hash-feature-img'}
            ], authors: [
                {name: 'Ghost Writer'},
                {name: 'Ghost Author'}
            ]},
            {slug: 'about', page: true}
        ]);

        gatsbyNode
            .sourceNodes({boundActionCreators: {createNode}}, {})
            .then(() => {
                createNode.callCount.should.eql(6);

                const getArg = call => createNode.getCall(call).args[0];

                // Check that we get the right type of node created
                getArg(0).internal.should.have.property('type', 'GhostPost');
                getArg(1).internal.should.have.property('type', 'GhostTag');
                getArg(2).internal.should.have.property('type', 'GhostTag');
                getArg(3).internal.should.have.property('type', 'GhostAuthor');
                getArg(4).internal.should.have.property('type', 'GhostAuthor');
                getArg(5).internal.should.have.property('type', 'GhostPage');

                done();
            })
            .catch(done);
    });
});
