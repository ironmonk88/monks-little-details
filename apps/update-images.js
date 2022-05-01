import { MonksLittleDetails, log, error, setting, i18n } from '../monks-little-details.js';

export class UpdateImages extends FormApplication {
    constructor(object, options = {}) {
        super(object, options);
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: "update-images",
            classes: ["form"],
            title: "Update Images",
            template: "modules/monks-little-details/templates/update-images.html",
            width: 550,
            height: 'auto'
        });
    }

    async getData() {   //this will get overwritten by Hidden Initiative if it's installed.
        const data = await super.getData();

        data.compendiums = {};
        for (let pack of game.packs) {
            if (pack.metadata.type == "Actor") {
                data.compendiums[pack.collection] = `${pack.title} - (${pack.metadata.package})`
            }
        }

        for (let i = 1; i <= 3; i++) {
            data["avatar-folder" + i] = game.user.getFlag("monks-little-details", "avatar" + i);
            data["token-folder" + i] = game.user.getFlag("monks-little-details", "token" + i);
        }

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        $('.convert', html).on("click", this.convert.bind(this));
    }

    convert() {
        let data = expandObject(super._getSubmitData());

        $('.conversion-results', this.element).empty().show();
        this.setPosition();

        let pack = game.packs.get(data.compendium);

        let avatars = [];
        for (let i = 1; i <= 3; i++) {
            if (data["avatar-folder"][i])
                avatars.push(data["avatar-folder"][i]);
            game.user.setFlag("monks-little-details", "avatar" + i, data["avatar-folder"][i]);
        }

        let tokens = [];
        for (let i = 1; i <= 3; i++) {
            if (data["token-folder"][i])
                tokens.push(data["token-folder"][i]);
            game.user.setFlag("monks-little-details", "token" + i, data["token-folder"][i]);
        }

        this.fixImages(pack, data["strict-name"], avatars, tokens);

        log("Try converting", data);
    }

    async getFiles(filename) {
        let source = "data";
        let pattern = filename;
        const browseOptions = { wildcard: true };

        // Support S3 matching
        if (/\.s3\./.test(pattern)) {
            source = "s3";
            const { bucket, keyPrefix } = FilePicker.parseS3URL(pattern);
            if (bucket) {
                browseOptions.bucket = bucket;
                pattern = keyPrefix;
            }
        }

        // Retrieve wildcard content
        try {
            const content = await FilePicker.browse(source, pattern, browseOptions);
            return content.files;
        } catch (err) {
            error(err);
            return null;
        }
        return [];
    }

    async fixEntry(entry, prop, imgname) {
        if (getProperty(entry, prop).toLowerCase() == imgname) {
            $('.conversion-results', this.element).append($('<li>').html(`Ignoring: ${entry.name}`));
            return true;
        }

        let files = await this.getFiles(imgname);
        if (files && files.length > 0) {
            let update = {};
            update[prop] = files[0];
            update = expandObject(update);

            await entry.update(update.data);
            log('Fixing:', entry.name, files[0]);
            $('.conversion-results', this.element).append($('<li>').html(`Fixing: ${entry.name}, ${files[0]}`));
            return true;
        }
        return false;
    }

    async fixImages(pack, strictname, avatars, tokens) {
        let onlyUnique = function (value, index, self) {
            return self.indexOf(value) === index;
        }

        if (pack) {
            await pack.configure({ locked: false });

            $('.conversion-results', this.element).append($('<li>').html(`Start conversion: ${pack.title}`));
            await pack.getDocuments().then(async (entries) => {
                for (var i = 0; i < entries.length; i++) {
                    var entry = entries[i];
                    var monname = entry.name.toLowerCase();
                    monname = monname.replace(/-/g, '').replace(/'/g, '').replace(/\(.*\)/, '').replace(/\s/g, '');

                    var mtype = entry.data.data.details.type?.value.toLowerCase() || entry.data.data.traits?.traits?.value || ""; //|| entry.data.data.details.creatureType?.toLowerCase()
                    mtype = (mtype instanceof Array ? mtype : [mtype]);
                    for (let i = 0; i < mtype.length; i++) {
                        if (mtype[i].indexOf(',') > 0) {
                            let temp = mtype[i].split(',');
                            mtype[i] = temp[0];
                            for (let j = 1; j < temp.length; j++)
                                mtype.push(temp[j]);
                        }
                        mtype[i] = mtype[i].replace(/\(.*\)/, '').replace(/\s/g, '');
                    }

                    mtype.unshift("");
                    mtype = mtype.filter(onlyUnique);

                    foundAvatar:
                    for (let avatar of avatars) {
                        for (let type of mtype) {
                            let imgname = `${avatar}/${type != "" ? type + "/" : ""}${monname}.png`;
                            let result = await this.fixEntry(entry, "data.img", imgname);
                            if (result)
                                break foundAvatar;

                            if (!strictname) {
                                let altname = monname;
                                if (altname.startsWith('ancient'))
                                    altname = altname.replace('ancient', '');
                                if (altname.startsWith('adult'))
                                    altname = altname.replace('adult', '');
                                if (altname.startsWith('young'))
                                    altname = altname.replace('young', '');

                                let imgname2 = `${avatar}/${type != "" ? type + "/" : ""}${altname}.png`;
                                if (imgname2 != imgname) {
                                    let result = await this.fixEntry(entry, "data.img", imgname2);
                                    if (result)
                                        break foundAvatar;
                                }
                            }
                        }
                    }
                    
                    foundToken:
                    for (let token of tokens) {
                        for (let type of mtype) {
                            var imgname = `${token}/${type != "" ? type + "/" : ""}${monname}.png`;

                            let result = await this.fixEntry(entry, "data.token.img", imgname);
                            if (result)
                                break foundToken;

                            if (!strictname) {
                                let altname = monname;
                                if (altname.startsWith('ancient'))
                                    altname = altname.replace('ancient', '');
                                if (altname.startsWith('adult'))
                                    altname = altname.replace('adult', '');
                                if (altname.startsWith('young'))
                                    altname = altname.replace('young', '');

                                let imgname2 = `${token}/${type != "" ? type + "/" : ""}${altname}.png`;
                                if (imgname2 != imgname) {
                                    let result = await this.fixEntry(entry, "data.token.img", imgname2);
                                    if (result)
                                        break foundToken;
                                }
                            }
                        }
                    }
                    
                }

                pack.configure({ locked: true });
                log("Completed: " + pack.title);
                $('.conversion-results', this.element).append($('<li>').html(`Completed: ${pack.title}`));
            });
        }
    }
}