import { MonksLittleDetails, log, error, setting, i18n } from '../monks-little-details.js';

export class UpdateImages extends FormApplication {
    constructor(object, options = {}) {
        super(object, options);
        this.autoscroll = true;
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
                data.compendiums[pack.collection] = `${pack.title} - (${pack.metadata.packageName})`
            }
        }
        data.compendium = game.user.getFlag("monks-little-details", "compendium");

        for (let i = 1; i <= 3; i++) {
            data["avatar-folder" + i] = game.user.getFlag("monks-little-details", "avatar" + i);
            data["token-folder" + i] = game.user.getFlag("monks-little-details", "token" + i);
        }
        data["sound-folder"] = game.user.getFlag("monks-little-details", "sound-folder");

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        let that = this;
        $('.convert', html).on("click", this.convert.bind(this));
        $('.conversion-results', html).on("scroll", this.scrollResults.bind(this))
    }

    scrollResults(event) {
        if (event.currentTarget.scrollTop + $(event.currentTarget).height() == event.currentTarget.scrollHeight)
            this.autoscroll = true;
        else
            this.autoscroll = false;
    }

    convert() {
        let data = expandObject(super._getSubmitData());

        $('.conversion-results', this.element).empty().show();
        this.setPosition();

        let pack = game.packs.get(data.compendium);

        game.user.setFlag("monks-little-details", "compendium", data.compendium);

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

        if (data["sound-folder"])
            game.user.setFlag("monks-little-details", "sound-folder", data["sound-folder"]);

        this.fixImages(pack, data["strict-name"], avatars, tokens, data["sound-folder"]);

        log("Try converting", data);
    }

    async getFiles(filename) {
        let source = "data";
        let pattern = filename;
        const browseOptions = {
            wildcard: true
            //, extensions: CONST.IMAGE_FILE_EXTENSIONS
        };

        if (typeof ForgeVTT != "undefined" && ForgeVTT.usingTheForge) {
            source = "forgevtt";
        }

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

    async fixEntry(entry, prop, imgname, type) {
        let files = await this.getFiles(imgname);
        if (files && files.length > 0) {
            let filenames = files.map(f => {
                let ext = f.split('.').pop();
                return {
                    name: f,
                    ext: ext
                }
            });
            filenames = filenames.sort((a, b) => { return b.ext.localeCompare(a.ext); });

            if (getProperty(entry, prop) == filenames[0].name) {
                this.addText(`<span>Ignoring ${type}: ${entry.name}, image is the same</span>`, "ignoring-update");
                return true;
            }

            let update = {};
            update[prop] = filenames[0].name;
            update = expandObject(update);

            try {
                await entry.update(update);
                log('Fixing:', entry.name, filenames[0].name);
                this.addText(`<span>Fixing ${type}: ${entry.name}, ${filenames[0].name}</span>`, "fixing-update");
            } catch {
                this.addText(`<span>Error: ${entry.name}, ${filenames[0].name}</span>`, "error-update");
            }
            return true;
        }
        return false;
    }

    async fixImages(pack, strictname, avatars, tokens, sound) {
        let onlyUnique = function (value, index, self) {
            return self.indexOf(value) === index;
        }

        if (pack) {
            await pack.configure({ locked: false });

            this.addText(`Start conversion: ${pack.title}`);
            await pack.getDocuments().then(async (entries) => {
                for (var i = 0; i < entries.length; i++) {
                    var entry = entries[i];
                    let names = [entry.name, entry.name.toLowerCase()];
                    let altname = entry.name.replace(/-/g, '').replace(/'/g, '').replace(/\(.*\)/, '').replace(/\s/g, '');
                    if (altname != entry.name) {
                        names.push(altname);
                        names.push(altname.toLowerCase());
                    }
                    if (entry.name.toLowerCase().startsWith("swarm")) {
                        altname = entry.name.replace(/SwarmOf/g, 'Swarm').replace(/Swarm Of/g, 'Swarm').replace(/Swarm of/g, 'Swarm').replace(/Swarmof/g, 'Swarm').replace(/swarmof/, 'swarm');
                        names.push(altname);
                        names.push(altname.toLowerCase());
                        altname = altname.replace(/-/g, '').replace(/'/g, '').replace(/\(.*\)/, '').replace(/\s/g, '');
                        names.push(altname);
                        names.push(altname.toLowerCase());
                    }
                    if (!strictname) {
                        for (let name of duplicate(names)) {
                            let flexname = name.replace('ancient', '').replace('adult', '').replace('young', '').replace('Ancient', '').replace('Adult', '').replace('Young', '');
                            if (flexname != name)
                                names.push(flexname);
                        }
                    }

                    var mtype = entry.system.details.type?.value.toLowerCase() || entry.system.traits?.traits?.value || ""; //|| entry.system.details.creatureType?.toLowerCase()
                    mtype = (mtype instanceof Array ? mtype : [mtype]);
                    if (entry.name.toLowerCase().startsWith("swarm"))
                        mtype.push("swarm");
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

                    let found = false;
                    foundAvatar:
                    for (let avatar of avatars) {
                        for (let name of names) {
                            for (let type of mtype) {
                                let imgname = `${avatar}/${type != "" ? type + "/" : ""}${name}.*`;
                                let result = await this.fixEntry(entry, "img", imgname, "avatar");
                                if (result) {
                                    found = true;
                                    break foundAvatar;
                                }
                            }
                        }
                    }
                    if (!found) {
                        this.addText(`<span>Unable to find avatar: ${entry.name}</span>`, "cant-find-update");
                    }

                    found = false;
                    foundToken:
                    for (let token of tokens) {
                        for (let name of names) {
                            for (let type of mtype) {
                                var imgname = `${token}/${type != "" ? type + "/" : ""}${name}.*`;

                                let result = await this.fixEntry(entry, "prototypeToken.texture.src", imgname, "token");
                                if (result) {
                                    found = true;
                                    break foundToken;
                                }
                            }
                        }
                    }
                    if (!found) {
                        this.addText(`<span>Unable to find token: ${entry.name}</span>`, "cant-find-update");
                    }

                    foundSound:
                    for (let name of names) {
                        for (let type of mtype) {
                            var soundname = `${sound}/${type != "" ? type + "/" : ""}${name}.*`;

                            let result = await this.fixEntry(entry, "flags.monks-little-details.sound-effect", soundname, "sound");
                            if (result)
                                break foundSound;
                        }
                    }
                    
                }

                pack.configure({ locked: true });
                log("Completed: " + pack.title);
                this.addText(`Completed: ${pack.title}`);
            });
        }
    }

    addText(text="", cls="") {
        $('.conversion-results', this.element).append($('<li>').addClass(cls).html(text));
        if (this.autoscroll) {
            $('.conversion-results', this.element).get(0).scrollTo(0, $('.conversion-results', this.element).get(0).scrollHeight);
        }
    }
}