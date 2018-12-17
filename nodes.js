const createNodeHelpers = require('gatsby-node-helpers').default;

const {
    createNodeFactory,
    generateNodeId
} = createNodeHelpers({
    typePrefix: 'Ghost'
});

const POST = 'Post';
const PAGE = 'Page';
const TAG = 'Tag';
const AUTHOR = 'Author';

function mapPostToTags(post, tags) {
    const postHasTags = post.tags && Array.isArray(post.tags) && post.tags.length;

    if (postHasTags) {
        // replace tags with links to their nodes
        post.tags___NODE = post.tags.map(t => generateNodeId(TAG, t.id));

        // add a backreference for this post to the tags
        post.tags.forEach(({id: tagId}) => {
            const tag = tags.find(t => t.id === tagId);
            if (!tag.posts___NODE) {
                tag.posts___NODE = [];
            }
            tag.posts___NODE.push(post.id);
        });

        // replace primary_tag with a link to the tag node
        if (post.primary_tag) {
            post.primary_tag___NODE = generateNodeId(TAG, post.primary_tag.id);
        }

        delete post.tags;
        delete post.primary_tag;
    }
}

function mapPostToUsers(post, users) {
    const postHasAuthors = post.authors && Array.isArray(post.authors) && post.authors.length;

    if (postHasAuthors) {
        // replace authors with links to their (user) nodes
        post.authors___NODE = post.authors.map(a => generateNodeId(AUTHOR, a.id));

        // add a backreference for this post to the user
        post.authors.forEach(({id: authorId}) => {
            const user = users.find(u => u.id === authorId);
            if (!user.posts___NODE) {
                user.posts___NODE = [];
            }
            user.posts___NODE.push(post.id);
        });

        // replace primary_author with a link to the user node
        if (post.primary_author) {
            post.primary_author___NODE = generateNodeId(AUTHOR, post.primary_author.id);
        }

        delete post.authors;
        delete post.primary_author;
    }
}

module.exports.createNodeFactories = ({tags, users}) => {
    const postNodeMiddleware = (node) => {
        mapPostToTags(node, tags);
        mapPostToUsers(node, users);
        return node;
    };

    const buildPostNode = createNodeFactory(POST, postNodeMiddleware);
    const buildPageNode = createNodeFactory(PAGE, postNodeMiddleware);
    const buildTagNode = createNodeFactory(TAG);
    const buildAuthorNode = createNodeFactory(AUTHOR);

    return {
        buildPostNode,
        buildPageNode,
        buildTagNode,
        buildAuthorNode
    };
};

