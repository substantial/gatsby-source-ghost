const createNodeHelpers = require('gatsby-node-helpers').default;
const {createRemoteFileNode} = require('gatsby-source-filesystem');

const TYPE_PREFIX = 'Ghost';
const {createNodeFactory, generateNodeId} = createNodeHelpers({
    typePrefix: TYPE_PREFIX
});

const POST = 'Post';
const TAG = 'Tag';
const AUTHOR = 'Author';
const MEDIA = 'Media';

async function downloadImageAndCreateFileNode(
    {url},
    {createNode, createNodeId, touchNode, store, cache}
) {
    let fileNodeID;

    const mediaDataCacheKey = `${TYPE_PREFIX}__Media__${url}`;
    const cacheMediaData = await cache.get(mediaDataCacheKey);

    if (cacheMediaData) {
        fileNodeID = cacheMediaData.fileNodeID;
        touchNode({nodeId: fileNodeID});
        return fileNodeID;
    }

    const fileNode = await createRemoteFileNode({
        url,
        store,
        cache,
        createNode,
        createNodeId
    });

    if (fileNode) {
        fileNodeID = fileNode.id;
        await cache.set(mediaDataCacheKey, {fileNodeID});
        return fileNodeID;
    }
}

function mapPostToTags(post, tags) {
    const postHasTags =
        post.tags && Array.isArray(post.tags) && post.tags.length;

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
    const postHasAuthors =
        post.authors && Array.isArray(post.authors) && post.authors.length;

    if (postHasAuthors) {
        // replace authors with links to their (user) nodes
        post.authors___NODE = post.authors.map(a => generateNodeId(AUTHOR, a.id)
        );

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
            post.primary_author___NODE = generateNodeId(
                AUTHOR,
                post.primary_author.id
            );
        }

        delete post.authors;
        delete post.primary_author;
    }
}

async function mapImagesToMedia(node) {
    if (node.feature_image) {
        node.feature_image___NODE = generateNodeId(MEDIA, node.feature_image);
        delete node.feature_image;
    }

    if (node.profile_image) {
        node.profile_image___NODE = generateNodeId(MEDIA, node.profile_image);
        delete node.profile_image;
    }

    if (node.cover_image) {
        node.cover_image___NODE = generateNodeId(MEDIA, node.cover_image);
        delete node.cover_image;
    }

    if (node.og_image) {
        node.og_image___NODE = generateNodeId(MEDIA, node.og_image);
        delete node.og_image;
    }

    if (node.twitter_image) {
        node.twitter_image___NODE = generateNodeId(MEDIA, node.twitter_image);
        delete node.twitter_image;
    }
}

function addPostCountToTag(tag, posts) {
    tag.postCount = posts.reduce((acc, post) => {
        const postHasTag = post.tags && !!post.tags.find(pt => tag.ghostId === pt.id);
        return postHasTag ? acc + 1 : acc;
    }, 0);
}

function addPostCountToAuthor(author, posts) {
    author.postCount = posts.reduce((acc, post) => {
        const postHasAuthor = post.authors && !!post.authors.find(pa => author.ghostId === pa.id);
        return postHasAuthor ? acc + 1 : acc;
    }, 0);
}

async function createLocalFileFromMedia(node, imageArgs) {
    node.localFile___NODE = await downloadImageAndCreateFileNode(
        {url: node.src.split('?')[0]},
        imageArgs
    );
}

module.exports.createNodeFactories = ({posts, tags, users}, imageArgs) => {
    const postNodeMiddleware = (node) => {
        mapPostToTags(node, tags);
        mapPostToUsers(node, users);
        mapImagesToMedia(node);
        return node;
    };

    const tagNodeMiddleware = (node) => {
        addPostCountToTag(node, posts);
        mapImagesToMedia(node);
        return node;
    };

    const authorNodeMiddleware = (node) => {
        addPostCountToAuthor(node, posts);
        mapImagesToMedia(node);
        return node;
    };

    const mediaNodeMiddleware = async (node) => {
        await createLocalFileFromMedia(node, imageArgs);
        return node;
    };

    const buildPostNode = createNodeFactory(POST, postNodeMiddleware);
    const buildTagNode = createNodeFactory(TAG, tagNodeMiddleware);
    const buildAuthorNode = createNodeFactory(AUTHOR, authorNodeMiddleware);
    const buildMediaNode = createNodeFactory(MEDIA, mediaNodeMiddleware);

    return {
        buildPostNode,
        buildTagNode,
        buildAuthorNode,
        buildMediaNode
    };
};
