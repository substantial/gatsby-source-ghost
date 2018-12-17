const GhostAPI = require('./api');
const {createNodeFactories} = require('./nodes');

exports.sourceNodes = async ({actions}, configOptions) => {
    const {createNode} = actions;

    return Promise.all([
        GhostAPI.fetchAllPosts(configOptions),
        GhostAPI.fetchAllTags(configOptions),
        GhostAPI.fetchAllUsers(configOptions)
    ]).then(([posts, tags, users]) => {
        const {
            buildPostNode,
            buildPageNode,
            buildTagNode,
            buildAuthorNode
        } = createNodeFactories({posts, tags, users});

        posts
            .filter(p => !p.page)
            .forEach(post => createNode(buildPostNode(post)));

        posts
            .filter(p => p.page)
            .forEach(page => createNode(buildPageNode(page)));

        tags.forEach(tag => createNode(buildTagNode(tag)));
        users.forEach(user => createNode(buildAuthorNode(user)));
    });
};
