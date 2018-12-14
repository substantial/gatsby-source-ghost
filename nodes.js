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

const replacePropWithNodeRef = (node, prop, refId) => {
    node[`${prop}___NODE`] =
        typeof refId === 'function' ? refId(node[prop]) : refId;
    delete node[prop];
};

module.exports.PostNode = createNodeFactory(POST, (node) => {
    if (node.primary_tag) {
        replacePropWithNodeRef(
            node,
            'primary_tag',
            generateNodeId(TAG, node.primary_tag.id)
        );
    }
    if (node.primary_author) {
        replacePropWithNodeRef(
            node,
            'primary_author',
            generateNodeId(AUTHOR, node.primary_author.id)
        );
    }
    if (node.tags) {
        replacePropWithNodeRef(
            node,
            'tags',
            tags => tags.map(t => generateNodeId(TAG, t.id))
        );
    }
    if (node.authors) {
        replacePropWithNodeRef(
            node,
            'authors',
            authors => authors.map(a => generateNodeId(AUTHOR, a.id))
        );
    }
    return node;
});

module.exports.PageNode = createNodeFactory(PAGE, (node) => {
    if (node.primary_author) {
        replacePropWithNodeRef(
            node,
            'primary_author',
            generateNodeId(AUTHOR, node.primary_author.id)
        );
    }
    if (node.tags) {
        replacePropWithNodeRef(
            node,
            'tags',
            tags => tags.map(t => generateNodeId(TAG, t.id))
        );
    }
    if (node.authors) {
        replacePropWithNodeRef(
            node,
            'authors',
            authors => authors.map(a => generateNodeId(AUTHOR, a.id))
        );
    }
    return node;
});

module.exports.TagNode = createNodeFactory(TAG);
module.exports.AuthorNode = createNodeFactory(AUTHOR);
