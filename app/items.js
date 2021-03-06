const TF2Items = require('tf2-items');
const fs = require('graceful-fs');

const Offer = require('./offer.js');

let manager;
let log;
let Items;

exports.register = function (automatic) {
    manager = automatic.manager;
    log = automatic.log;
};

exports.init = function (callback) {
    Items = new TF2Items({ apiKey: manager.apiKey });

    Items.on('schema', schemaUpdate);

    if (fs.existsSync('./temp/schema.json')) {
        const json = fs.readFileSync('./temp/schema.json');
        const schema = JSON.parse(json);
        Items.setSchema(schema);
    }

    log.debug('Initializing tf2-items package.');
    Items.init(function (err) {
        if (err) {
            callback(new Error('tf2-items (' + err.message + ')'));
            return;
        }
        callback(null);
    });
};

exports.createDictionary = createDictionary;
exports.createSummary = createSummary;
exports.getItemFromDict = getItemFromDict;
exports.pure = getPure;
exports.findMatch = findMatch;

exports.getQuality = getQuality;
exports.getEffect = getEffect;
exports.getName = getName;

exports.getModule = function () {
    return Items;
};

function createDictionary (items) {
    const dict = {};
    for (let i = 0; i < items.length; i++) {
        const item = Offer.getItem(items[i]);
        if (item === null) {
            continue;
        }

        let name = getName(item);
        if (item.quality == 15) {
            name = 'Decorated Weapon ' + name;
        }

        (dict[name] = (dict[name] || [])).push(item.id);
    }
    return dict;
}

function getPure (dictionary, getKeys = true) {
    const pure = {
        keys: getKeys == true ? getItemFromDict(dictionary, 'Mann Co. Supply Crate Key') : [],
        refined: getItemFromDict(dictionary, 'Refined Metal'),
        reclaimed: getItemFromDict(dictionary, 'Reclaimed Metal'),
        scrap: getItemFromDict(dictionary, 'Scrap Metal')
    };
    return pure;
}

function getItemFromDict (dictionary, name) {
    return dictionary[name] || [];
}

function createSummary (dictionary) {
    const summary = {};
    for (const name in dictionary) {
        if (!dictionary.hasOwnProperty(name)) {
            continue;
        }

        const amount = dictionary[name].length;
        summary[name] = amount;
    }
    return summary;
}

function findMatch (search) {
    search = search.toLowerCase();

    const match = [];
    const schema = Items.schema.items;
    for (let i = 0; i < schema.length; i++) {
        const name = schema[i].proper_name ? 'The ' + schema[i].item_name : schema[i].item_name;
        if (name.toLowerCase() == search) {
            return schema[i].defindex;
        } else if (name.toLowerCase().indexOf(search) != -1) {
            match.push(schema[i]);
        }
    }

    if (match.length == 0) {
        return null;
    } else if (match.length == 1) {
        return match[0].defindex;
    }

    for (let i = 0; i < match.length; i++) {
        const name = match[i].proper_name ? 'The ' + match[i].item_name : match[i].item_name;
        match[i] = name;
    }

    return match;
}

function getQuality (quality) {
    return Items.schema.getQuality(quality);
}

function getEffect (effect) {
    return Items.schema.getEffect(effect);
}

function getName (item) {
    return Items.schema.getName(item);
}

function schemaUpdate (schema) {
    const json = schema.toJSON();
    fs.writeFileSync('./temp/schema.json', JSON.stringify(json));
}
