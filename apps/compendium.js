import { MonksLittleDetails, log, setting, i18n } from '../monks-little-details.js';

export class MonksCompendium {
    static init() {
        Object.defineProperty(CompendiumPacks.prototype, 'tree', {
            get: function () {
                if (!this._tree) this.initializeTree();
                return this._tree;
            }
        });

        Object.defineProperty(CompendiumPacks.prototype, 'name', {
            get: function () {
                return "CompendiumPacks";
            }
        });

        CompendiumPacks.prototype.initializeTree = function () {
            const folders = this.folders.contents;
            const entries = this._getVisibleTreeContents();
            this._tree = this.buildTree(folders, entries);
        }

        CompendiumPacks.prototype.buildTree = function (folders, entries) {
            const handled = new Set();
            const createNode = (root, folder, depth) => {
                return { root, folder, depth, visible: false, children: [], entries: [] };
            };

            // Create the tree structure
            const tree = createNode(true, null, 0);
            const depths = [[tree]];

            // Iterate by folder depth, populating content
            for (let depth = 1; depth <= this.maxFolderDepth + 1; depth++) {
                const allowChildren = depth <= this.maxFolderDepth;
                depths[depth] = [];
                const nodes = depths[depth - 1];
                if (!nodes.length) break;
                for (const node of nodes) {
                    const folder = node.folder;
                    if (!node.root) { // Ensure we don't encounter any infinite loop
                        if (handled.has(folder.id)) continue;
                        handled.add(folder.id);
                    }

                    // Classify content for this folder
                    const classified = this.classifyFolderContent(folder, folders, entries, { allowChildren });
                    node.entries = classified.entries;
                    node.children = classified.folders.map(folder => createNode(false, folder, depth));
                    depths[depth].push(...node.children);

                    // Update unassigned content
                    folders = classified.unassignedFolders;
                    entries = classified.unassignedEntries;
                }
            }

            // Populate left-over folders at the root level of the tree
            for (const folder of folders) {
                const node = createNode(false, folder, 1);
                const classified = this.classifyFolderContent(folder, folders, entries, { allowChildren: false });
                node.entries = classified.entries;
                entries = classified.unassignedEntries;
                depths[1].push(node);
            }

            // Populate left-over entries at the root level of the tree
            if (entries.length) {
                tree.entries.push(...entries);
            }

            // Sort the top level entries and folders
            const sort = this.getSort(this.sortingMode);
            tree.entries.sort(sort);
            tree.children.sort((a, b) => sort(a.folder, b.folder));

            // Recursively filter visibility of the tree
            const filterChildren = node => {
                node.children = node.children.filter(child => {
                    filterChildren(child);
                    return child.visible;
                });
                node.visible = node.root || game.user.isGM || ((node.children.length + node.entries.length) > 0);

                // Populate some attributes of the Folder document
                if (node.folder) {
                    node.folder.displayed = node.visible;
                    node.folder.depth = node.depth;
                    node.folder.children = node.children;
                }
            };
            filterChildren(tree);
            return tree;
        }

        CompendiumPacks.prototype.classifyFolderContent = function (folder, folders, entries, { allowChildren = true } = {}) {
            const sort = this.getSort(foundry.utils.getProperty(folder, "flags.monks-little-details.sorting"));

            // Determine whether an entry belongs to a folder, via folder ID or folder reference
            function folderMatches(entry) {
                if (entry.folder?._id) return entry.folder._id === folder?._id;
                return (entry.folder === folder) || (entry.folder === folder?._id);
            }

            // Partition folders into children and unassigned folders
            const [unassignedFolders, subfolders] = folders.partition(f => allowChildren && folderMatches(f));
            subfolders.sort(sort);

            // Partition entries into folder contents and unassigned entries
            const [unassignedEntries, contents] = entries.partition(e => folderMatches(e));
            contents.sort(sort);

            // Return the classified content
            return { folders: subfolders, entries: contents, unassignedFolders, unassignedEntries };
        }

        CompendiumPacks.prototype.setSortingMode = function (sortingMode) {
            const name = this.collection ?? this.name;
            const sortingModes = game.settings.get("core", "collectionSortingModes");
            sortingModes[name] = sortingMode;
            game.settings.set("core", "collectionSortingModes", sortingModes);
            this.initializeTree();
        }

        CompendiumPacks.prototype.getSort = function (sort) {
            switch (sort) {
                case "a": return this.constructor._sortAlphabetical;
                case "m": return this.constructor._sortStandard;
                case "s": return this.constructor._sortBySource;
                case "t":
                default: return this.constructor._sortByType;
            }
        }

        CompendiumPacks.prototype.constructor._sortByType = function (a, b) {
            if (a.metadata?.type && b.metadata?.type && a.metadata?.type !== b.metadata?.type)
                return (a.metadata?.type || "").localeCompare(b.metadata?.type || "");
            return CompendiumPacks._sortAlphabetical(a, b);
        }

        CompendiumPacks.prototype.constructor._sortBySource = function (a, b) {
            if (a.metadata?.packageType && b.metadata?.packageType && a.metadata?.packageType !== b.metadata?.packageType)
                return (a.metadata?.packageType === "world" ? 0 : (a.metadata?.packageType === "system" ? 1 : 2)) - (b.metadata?.packageType === "world" ? 0 : (b.metadata?.packageType === "system" ? 1 : 2));
            if (a.metadata?.packageName && b.metadata?.packageName && a.metadata?.packageName !== b.metadata?.packageName)
                return (a.metadata?.packageName || "").localeCompare(b.metadata?.packageName || "");
            return CompendiumPacks._sortAlphabetical(a, b);
        }

        Hooks.on("renderCompendiumDirectory", (app, html, options) => {
            let sortingMode = app.collection.sortingMode;
            let icon = "";
            let tooltip = "";
            switch (sortingMode) {
                case "a": icon = "fa-arrow-down-a-z"; tooltip = "SIDEBAR.SortModeAlpha"; break;
                case "t": icon = "fa-arrow-down-triangle-square"; tooltip = "SIDEBAR.SortModeType"; break;
                case "s": icon = "fa-arrow-down-big-small"; tooltip = "SIDEBAR.SortModeSource"; break;
                case "m":
                default:
                    icon = "fa-arrow-down-short-wide"; tooltip = "SIDEBAR.SortModeManual"; break;
            }

            $('.toggle-sort', html).off("click").html(`<i class="fas ${icon}"></i>`).attr("data-tooltip", tooltip);
            let contextmenuitems = [
                {
                    name: "FOLDER.SortAlphabetical",
                    icon: '<i class="fas fa-arrow-down-a-z"></i>',
                    callback: li => {
                        app.collection.setSortingMode("a");
                        app.render();
                    }
                },
                {
                    name: "FOLDER.SortManual",
                    icon: '<i class="fas fa-arrow-down-short-wide"></i>',
                    callback: li => {
                        app.collection.setSortingMode("m");
                        app.render();
                    }
                },
                {
                    name: "FOLDER.SortType",
                    icon: '<i class="fas fa-arrow-down-triangle-square"></i>',
                    callback: li => {
                        app.collection.setSortingMode("t");
                        app.render();
                    }
                },
                {
                    name: "FOLDER.SortSource",
                    icon: '<i class="fa-solid fa-arrow-down-big-small"></i>',
                    callback: li => {
                        app.collection.setSortingMode("s");
                        app.render();
                    }
                }
            ];
            new ContextMenu(html, ".toggle-sort", contextmenuitems, { eventName: "click" });

            let parseEntries = (item) => {
                let types = {};
                let sort = foundry.utils.getProperty(item, "folder.flags.monks-little-details.sorting") || sortingMode;
                if (sort == "t" || sort == "s") {
                    for (let entry of item.entries) {
                        let prop = entry.metadata[sort == "t" ? "type" : "packageName"];
                        let pkgName = entry.metadata.packageType == "world" ? "world" : entry.metadata.packageName;
                        let elem = $(`li[data-entry-id="${pkgName}.${entry.metadata.name}"]`, html);
                        elem.attr("data-type", entry.metadata.type);
                        if (!types[prop]) {
                            let name = prop;
                            if (sort == "s")
                                name = entry.metadata.packageType == "module" ? game.modules.get(prop)?.title : game[entry.metadata.packageType].title;
                            else if (sort == "t") {
                                let key = `DOCUMENT.${prop}`;
                                let checkName = i18n(key);
                                name = checkName == key ? name : checkName;
                            }

                            if (sort === "s" && entry.metadata.packageType === "module") {
                                let module = game.modules.get(entry.metadata.packageName);
                                if (module && module.flags["forge-compendium-browser"]?.active)
                                    continue;
                            }
                            elem.before(`<li class="compendium-type" data-type="${prop}"><h3 class="noborder">${name}</h3></li>`);
                            types[prop] = true;
                        }
                    }
                }

                for (let child of item.children) {
                    parseEntries(child);
                }
            }

            parseEntries(options.tree);

            if (setting("compendium-shortcuts") && app.collection.sortingMode === "t") {
                let shortcut = $('<div>').addClass('action-buttons flexrow').append(`
                    <nav class="tabs compendium-shortcut-links">
                        <a class="item" data-tab="Actor" data-tooltip="DOCUMENT.Actors" alt="DOCUMENT.Actors">
                            <i class="fas fa-user"></i>
                        </a>
                        <a class="item" data-tab="Adventure" data-tooltip="DOCUMENT.Adventures" alt="DOCUMENT.Adventures">
                            <i class="fas fa-map-pin"></i>
                        </a>
                        <a class="item" data-tab="Cards" data-tooltip="DOCUMENT.CardsPlural" alt="DOCUMENT.CardsPlural">
                            <i class="fa-solid fa-cards"></i>
                        </a>
                        <a class="item" data-tab="Item" data-tooltip="DOCUMENT.Items" alt="DOCUMENT.Items">
                            <i class="fas fa-suitcase"></i>
                        </a>
                        <a class="item" data-tab="JournalEntry" data-tooltip="DOCUMENT.JournalEntries" alt="DOCUMENT.JournalEntries">
                            <i class="fas fa-book-open"></i>
                        </a>
                        <a class="item" data-tab="Macro" data-tooltip="DOCUMENT.Macros" alt="DOCUMENT.Macros">
                            <i class="fas fa-code"></i>
                        </a>
                        <a class="item" data-tab="Playlist" data-tooltip="DOCUMENT.Playlists" alt="DOCUMENT.Playlists">
                            <i class="fas fa-music"></i>
                        </a>
                        <a class="item" data-tab="RollTable" data-tooltip="DOCUMENT.RollTables" alt="DOCUMENT.RollTables">
                            <i class="fas fa-th-list"></i>
                        </a>
                        <a class="item" data-tab="Scene" data-tooltip="DOCUMENT.Scenes" alt="DOCUMENT.Scenes">
                            <i class="fas fa-map"></i>
                        </a>
                    </nav>`);
                $('.item', shortcut).on("click", (evt) => {
                    let id = evt.currentTarget.dataset.tab;
                    let title = $(`.directory-list > li.compendium-type[data-type="${id}"]`, app.element);
                    if (title.length) {
                        title[0].scrollIntoView({ behavior: "smooth", block: "start" });
                        $(`.directory-list > li.directory-item[data-type="${id}"]`, app.element).addClass("highlight");
                        window.setTimeout(() => {
                            $(`.directory-list > li.directory-item[data-type="${id}"]`, app.element).removeClass("highlight");
                        }, 1000);
                    }
                }).each((idx, elem) => {
                    let id = elem.dataset.tab;
                    let title = $(`.directory-list > li.compendium-type[data-type="${id}"]`, app.element);
                    $(elem).toggleClass("disabled", !title.length);
                });
                $('.directory-header', html).append(shortcut);
            }
        });

        Hooks.on("renderFolderConfig", (app, html, options) => {
            if (app.object.type === "Compendium") {
                $('input[name="sorting"]', html).closest(".form-fields").empty().append($("<select>").attr("name", "flags.monks-little-details.sorting").append([
                    `<option value="a">${i18n("FOLDER.SortAlphabetical")}</option>`,
                    `<option value="m">${i18n("FOLDER.SortManual")}</option>`,
                    `<option value="t">${i18n("FOLDER.SortType")}</option>`,
                    `<option value="s">${i18n("FOLDER.SortSource")}</option>`
                ]).val(foundry.utils.getProperty(options, "folder.flags.monks-little-details.sorting") || "a"));
            }
        });
    }
}