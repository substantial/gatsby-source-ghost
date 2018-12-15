const GhostAPI = require('./api');
const {PostNode, PageNode, TagNode, AuthorNode} = require('./nodes');

exports.sourceNodes = async ({boundActionCreators}, configOptions) => {
    const {createNode} = boundActionCreators;


    return Promise.all([
        GhostAPI.fetchAllPosts(configOptions),
        GhostAPI.fetchAllTags(configOptions),
        GhostAPI.fetchAllUsers(configOptions)
    ]).then(([posts, tags, users]) => {
        posts.filter(p => p.page).forEach((page) => {
            createNode(PageNode(page));
        });

        posts.filter(p => !p.page).forEach((post) => {
            createNode(PostNode(post));
        });

        tags.forEach((tag) => {
            createNode(TagNode(tag));
        });

        users.forEach((user) => {
            createNode(AuthorNode(user));
        });
    });
};
