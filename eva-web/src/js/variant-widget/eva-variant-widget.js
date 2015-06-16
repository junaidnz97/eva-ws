/*
 * Copyright (c) 2014 Francisco Salavert (SGL-CIPF)
 * Copyright (c) 2014 Alejandro Alemán (SGL-CIPF)
 * Copyright (c) 2014 Ignacio Medina (EBI-EMBL)
 * Copyright (c) 2014 Jag Kandasamy (EBI-EMBL)
 *
 * This file is part of EVA.
 *
 * EVA is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EVA is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EVA. If not, see <http://www.gnu.org/licenses/>.
 */
function EvaVariantWidget(args) {

    _.extend(this, Backbone.Events);

    this.id = Utils.genId("VariantWidget");

    //set default args
    this.target;
    this.width;
    this.height;
    this.autoRender = true;
    this.data = [];
    this.host;
    this.closable = true;
    this.filters = {
        segregation: true,
        maf: true,
        effect: true,
        region: true,
        gene: true
    };
    this.headerConfig;
    this.attributes = [];
    this.columns = [];
    this.samples = [];
    this.defaultToolConfig = {
        headerConfig: {
            baseCls: 'ocb-title-2'
        },
        effect: true,
        genomeViewer: true,
        genotype: true,
        stats: true,
        rawData: true,
        populationStats: true,
        annot:true
    };
    this.tools = [];
    this.dataParser;
    this.responseParser;

    this.responseRoot = "response[0].result";
    this.responseTotal = "response[0].numTotalResults";
    this.startParam = "skip";

    this.browserGridConfig = {
        title: 'variant browser grid',
        border: true
    };
    this.toolPanelConfig = {
        title: 'Variant data',
        border: true
    };
    this.toolsConfig = {
        headerConfig: {
            baseCls: 'ocb-title-2'
        }
    };


    _.extend(this.filters, args.filters);
    _.extend(this.browserGridConfig, args.browserGridConfig);
    _.extend(this.defaultToolConfig, args.defaultToolConfig);

    delete args.filters;
    delete args.defaultToolConfig;

//set instantiation args, must be last
    _.extend(this, args);

    this.selectedToolDiv;

    this.rendered = false;
    if (this.autoRender) {
        this.render();
    }

}

EvaVariantWidget.prototype = {
    render: function () {
        var _this = this;

        //HTML skel
        this.div = document.createElement('div');
        this.div.setAttribute('id', this.id);

        this.variantBrowserGridDiv = document.createElement('div');
        this.variantBrowserGridDiv.setAttribute('class', 'ocb-variant-widget-grid');
        this.div.appendChild(this.variantBrowserGridDiv);

        this.variantBrowserGrid = this._createVariantBrowserGrid(this.variantBrowserGridDiv);

        this.tabPanelDiv = document.createElement('div');
        this.tabPanelDiv.setAttribute('class', 'ocb-variant-tab-panel');
        this.div.appendChild(this.tabPanelDiv);

        this.toolTabPanel = Ext.create("Ext.tab.Panel", {
            title: this.toolPanelConfig.title,
            border: this.toolPanelConfig.border,
            margin: '10 0 0 0',
            plain: true,
            animCollapse: false,
            header: this.toolPanelConfig.headerConfig,
            collapseDirection: Ext.Component.DIRECTION_BOTTOM,
            titleCollapse: true,
            overlapHeader: true,
            defaults: {
                border: false,
                hideMode: 'offsets',
                autoShow: true
            },
            listeners: {
                tabchange: function (tabPanel, newTab, oldTab, eOpts) {
                    _this.selectedToolDiv = newTab.contentEl.dom;
                    if (_this.lastVariant) {
                        _this.trigger('variant:change', {variant: _this.lastVariant, sender: _this});
                    }
                }
            }
        });

        var tabPanelItems = [];

        if (this.defaultToolConfig.stats) {
            this.variantStatsPanelDiv = document.createElement('div');
            this.variantStatsPanelDiv.setAttribute('class', 'ocb-variant-stats-panel');
            this.variantStatsPanel = this._createVariantStatsPanel(this.variantStatsPanelDiv);
            tabPanelItems.push({
                title: 'File and Stats',
//                border: 0,
                contentEl: this.variantStatsPanelDiv
            });
        }

        if (this.defaultToolConfig.effect) {
            this.variantEffectGridDiv = document.createElement('div');
            this.variantEffectGridDiv.setAttribute('class', 'ocb-variant-effect-grid');
            this.variantEffectGrid = this._createVariantEffectGrid(this.variantEffectGridDiv);
            tabPanelItems.push({
                title: 'Effect and Annotation',
                contentEl: this.variantEffectGridDiv
            });
        }

        if (this.defaultToolConfig.genotype) {
            this.variantGenotypeGridDiv = document.createElement('div');
            this.variantGenotypeGridDiv.setAttribute('class', 'ocb-variant-genotype-grid');
            this.variantGenotypeGrid = this._createVariantGenotypeGrid(this.variantGenotypeGridDiv);
            tabPanelItems.push({
                title: 'Genotypes',
//                border: 0,
                contentEl: this.variantGenotypeGridDiv
            });
        }

        if (this.defaultToolConfig.rawData) {
            this.variantrawDataPanelDiv = document.createElement('div');
            this.variantrawDataPanelDiv.setAttribute('class', 'ocb-variant-rawdata-panel');
            this.variantrawDataPanel = this._createVariantRawDataPanel(this.variantrawDataPanelDiv);
            tabPanelItems.push({
                title: 'Raw Data',
//                border: 0,
                contentEl: this.variantrawDataPanelDiv
            });
        }
        if (this.defaultToolConfig.populationStats) {
            this.variantPopulationStatsPanelDiv = document.createElement('div');
            this.variantPopulationStatsPanelDiv.setAttribute('class', 'ocb-variant-rawdata-panel');
            this.variantPopulationStatsPanel = this._createVariantPopulationStatsPanel(this.variantPopulationStatsPanelDiv);
            tabPanelItems.push({
                title: 'Population Stats',
//                border: 0,
                contentEl: this.variantPopulationStatsPanelDiv
            });
        }

        if (this.defaultToolConfig.annot) {
            this.annotPanelDiv = document.createElement('div');
            this.annotPanelDiv.setAttribute('class', 'ocb-variant-stats-panel');
            this.annotPanel = this._createAnnotPanel(this.annotPanelDiv);
            tabPanelItems.push({
                title: 'Annotation',
//                border: 0,
                contentEl: this.annotPanelDiv
            });
        }

        if (this.defaultToolConfig.genomeViewer) {
            this.genomeViewerDiv = document.createElement('div');
            this.genomeViewerDiv.setAttribute('class', 'ocb-gv');
            $(this.genomeViewerDiv).css({border: '1px solid lightgray'});
            this.genomeViewer = this._createGenomeViewer(this.genomeViewerDiv);
            tabPanelItems.push({
                title: 'Genomic Context',
                border: 0,
                contentEl: this.genomeViewerDiv
            });
        }

        for (var i = 0; i < this.tools.length; i++) {
            var tool = this.tools[i];
            var toolDiv = document.createElement('div');

            tool.tool.target = toolDiv;

            tabPanelItems.push({
                title: tool.title,
                contentEl: toolDiv
            });
        }

        this.toolTabPanel.add(tabPanelItems);

        this.rendered = true;
    },
    draw: function () {
        var _this = this;
        this.targetDiv = (this.target instanceof HTMLElement ) ? this.target : document.querySelector('#' + this.target);
        if (!this.targetDiv) {
            console.log('EVAVAriantWidget target not found');
            return;
        }
        this.targetDiv.appendChild(this.div);

        this.variantBrowserGrid.draw();

        this.toolTabPanel.render(this.tabPanelDiv);


        for (var i = 0; i < this.toolTabPanel.items.items.length; i++) {
            this.toolTabPanel.setActiveTab(i);
        }

        if (this.defaultToolConfig.effect) {

            this.variantEffectGrid.draw();
        }

        if (this.defaultToolConfig.genotype) {

            this.variantGenotypeGrid.draw();
        }

        if (this.defaultToolConfig.genomeViewer) {
            this.genomeViewer.draw();
        }

        if (this.defaultToolConfig.annot) {
            this.annotPanel.draw();
        }

        if (this.defaultToolConfig.stats) {
            this.variantStatsPanel.draw();
        }

        if (this.defaultToolConfig.rawData) {
            this.variantrawDataPanel.draw();
        }
        if (this.defaultToolConfig.populationStats) {
            this.variantPopulationStatsPanel.draw();
        }

        for (var i = 0; i < this.tools.length; i++) {
            var tool = this.tools[i];
            tool.tool.draw();
        }

        this.toolTabPanel.setActiveTab(0);
    },
    _createVariantBrowserGrid: function (target) {
        var _this = this;

        var columns ={
            items:[
                {
                    text: "Chr",
                    dataIndex: 'chromosome',
//                    flex: 0.5,/
                    width:50
                },
                {
                    text: 'Position',
                    dataIndex: 'start',
//                    flex: 0.5,
                    width:100
                },
                {
                    header: '<img class="header-icon" style="margin-bottom:0px;" src="img/icon-info.png"/>ID',
                    dataIndex: 'id',
//                    flex: 0.5,
//                    renderer: function(value, meta, rec, rowIndex, colIndex, store){
//                         var snpID = '-';
//                         if(!_.isUndefined(value)){
//                             _.each(_.keys(value), function(key){
//                                 if(this[key].src == 'dbSNP'){
//                                     snpID = '<a href="http://www.ncbi.nlm.nih.gov/SNP/snp_ref.cgi?searchType=adhoc_search&type=rs&rs='+this[key].id+'" target="_blank">'+this[key].id+'</a>'
//                                 }
//                             },value);
//
//                             return snpID;
//                         }
//                    },
                    width:130,
                    iconCls : 'icon-info',
                    tooltip:'dbSNP ID(Human), TransPlant ID(Plant) and Submitted ID(others)',
                },
                //{
                //text: 'End',
                //dataIndex: 'end'
                //},
                {
                    text: 'Alleles',
                    xtype: "templatecolumn",
                    tpl: '<tpl if="reference">{reference}<tpl else>-</tpl>/<tpl if="alternate">{alternate}<tpl else>-</tpl>',
//                    renderer: function(value, metaData, record, row, col, store, gridView){
////                        console.log(record)
//                    },
//                    flex: 0.5
                    width:60
                },
                {
                    text: 'Class',
                    dataIndex: 'type',
//                    flex: 0.3,
                    xtype: "templatecolumn",
                    tpl: '<tpl if="type"><a href="http://www.ncbi.nlm.nih.gov/books/NBK44447/#Content.what_classes_of_genetic_variatio" target="_blank">{type}</a><tpl else>-</tpl>',
                    width:60
                },
//            {
//                text: '1000G MAF',
//                dataIndex: ''
//            },
//            {
//                text: 'Consequence Type',
//                dataIndex: 'ct'
//            },
//                {
//                    text: 'Gene',
//                    dataIndex: 'gene',
//                    flex: 1
//                },
//            {
//                text: 'HGVS Names',
//                dataIndex: 'hgvs_name'
//            },
//                {
//                    text: 'Gene',
//                    dataIndex: 'gene'
//                },
                {
                    text: 'Most Severe <br /> Consequence Type',
                    dataIndex: 'consequenceTypes',
                    renderer: function(value, meta, rec, rowIndex, colIndex, store){
                        var tempArray = [];
                        var consequenceTypes = rec.data.consequenceTypes;
                        if(!_.isUndefined(value)){
                            var tempArray = [];
                            _.each(_.keys(consequenceTypes), function(key){
                                var so_terms = this[key].soTerms;
                                _.each(_.keys(so_terms), function(key){
                                    tempArray.push(this[key].soName)
                                },so_terms);
                            },consequenceTypes);


                            var groupedArr = _.groupBy(tempArray);
                            var so_array = [];
                            _.each(_.keys(groupedArr), function(key){
                                var index =  _.indexOf(consequenceTypesHierarchy, key);
//                                        so_array.splice(index, 0, key+' ('+this[key].length+')');
//                                        so_array.push(key+' ('+this[key].length+')')
//                                so_array[index] = key+' ('+this[key].length+')';
                                so_array[index] = key;
                            },groupedArr);
                            so_array =  _.compact(so_array);
                            meta.tdAttr = 'data-qtip="'+so_array.join('\n')+'"';
                            return value ? Ext.String.format(
//                                '<tpl>'+so_array.join()+'</tpl>',
                                '<tpl>'+_.first(so_array)+'</tpl>',
                                value
                            ) : '';
                        }else{
                            return '';
                        }

//                        return tempArray.join();
                    },
//                    flex: 1
                    width:230,
                },

//                {
//                    text: "Conserved Regions",
//                    columns: [
//                        {
//                            text: "phyloP",
//                            dataIndex: "conservedRegionScores",
//                            width:130,
//                            renderer: function(value, meta, rec, rowIndex, colIndex, store){
//                                var conservedRegionScores = rec.data.conservedRegionScores;
//                                _.each(_.keys(conservedRegionScores), function(key){
//                                   if(this[key].source == 'phylop'){
//                                       value = this[key].score.toFixed(3);
//                                   }
//                                },conservedRegionScores);
//                                return value;
//                            }
//
//                        },
//                        {
//                            text: "PhastCons",
//                            dataIndex: "conservedRegionScores",
//                            width:130,
//                            renderer: function(value, meta, rec, rowIndex, colIndex, store){
//                                var conservedRegionScores = rec.data.conservedRegionScores;
//                                _.each(_.keys(conservedRegionScores), function(key){
//                                    if(this[key].source == 'phastCons'){
//                                        value = this[key].score.toFixed(3);
//                                    }
//                                },conservedRegionScores);
//                                return value;
//                            }
//                        }
//                    ]
//                },
                {
                    text: "Protein substitution scores",
                    columns: [
                        {
                            text: "Polyphen2",
                            dataIndex: "consequenceTypes",
                            width:130,
                            renderer: function(value, meta, rec, rowIndex, colIndex, store){
                                var tempArray = [];
                                var consequenceTypes = rec.data.consequenceTypes;
                                if(!_.isUndefined(value)){
                                    var tempArray = [];
                                    _.each(_.keys(consequenceTypes), function(key){
                                        var so_terms = this[key].soTerms;
                                        _.each(_.keys(so_terms), function(key){
                                            tempArray.push(this[key].soName)
                                        },so_terms);
                                    },consequenceTypes);


                                    var groupedArr = _.groupBy(tempArray);
                                    var so_array = [];
                                    _.each(_.keys(groupedArr), function(key){
                                        var index =  _.indexOf(consequenceTypesHierarchy, key);
//                                        so_array.splice(index, 0, key+' ('+this[key].length+')');
//                                        so_array.push(key+' ('+this[key].length+')')
//                                so_array[index] = key+' ('+this[key].length+')';
                                        so_array[index] = key;
                                    },groupedArr);
                                    so_array =  _.compact(so_array);
                                    meta.tdAttr = 'data-qtip="'+so_array.join('\n')+'"';
                                    var score = '-';
                                    for (i = 0; i < consequenceTypes.length; i++) {
                                        for (j = 0; j < consequenceTypes[i].soTerms.length; j++) {
                                            if(consequenceTypes[i].soTerms[j].soName == _.first(so_array)){
                                                _.each(_.keys(consequenceTypes[i].proteinSubstitutionScores), function(key){
                                                    if(this[key].source == 'Polyphen'){
                                                        score = this[key].score;
                                                    }
                                                },consequenceTypes[i].proteinSubstitutionScores);
                                            }

                                        }
                                    }

                                    return score;


                                }else{
                                    return '';
                                }
                            },

                        },
                        {
                            text: "Sift",
                            dataIndex: "consequenceTypes",
                            width:130,
                            renderer: function(value, meta, rec, rowIndex, colIndex, store){
                                var tempArray = [];
                                var consequenceTypes = rec.data.consequenceTypes;
                                if(!_.isUndefined(value)){
                                    var tempArray = [];
                                    _.each(_.keys(consequenceTypes), function(key){
                                        var so_terms = this[key].soTerms;
                                        _.each(_.keys(so_terms), function(key){
                                            tempArray.push(this[key].soName)
                                        },so_terms);
                                    },consequenceTypes);


                                    var groupedArr = _.groupBy(tempArray);
                                    var so_array = [];
                                    _.each(_.keys(groupedArr), function(key){
                                        var index =  _.indexOf(consequenceTypesHierarchy, key);
//                                        so_array.splice(index, 0, key+' ('+this[key].length+')');
//                                        so_array.push(key+' ('+this[key].length+')')
//                                so_array[index] = key+' ('+this[key].length+')';
                                        so_array[index] = key;
                                    },groupedArr);
                                    so_array =  _.compact(so_array);
                                    meta.tdAttr = 'data-qtip="'+so_array.join('\n')+'"';
                                    var score = '-';
                                    for (i = 0; i < consequenceTypes.length; i++) {
                                        for (j = 0; j < consequenceTypes[i].soTerms.length; j++) {
                                            if(consequenceTypes[i].soTerms[j].soName == _.first(so_array)){
                                                _.each(_.keys(consequenceTypes[i].proteinSubstitutionScores), function(key){
                                                    if(this[key].source == 'Sift'){
                                                        score = this[key].score;
                                                    }
                                                },consequenceTypes[i].proteinSubstitutionScores);
                                            }

                                        }
                                    }

                                    return score;


                                }else{
                                    return '';
                                }
                            },
                        }
                    ]
                },
                {
                    text: 'View',
                    dataIndex: 'id',
                    id:'variant-grid-view-column',
                    xtype: 'templatecolumn',
                    tpl: '<tpl if="id"><a href="?variant={chromosome}:{start}:{reference}:{alternate}" target="_blank"><img class="eva-grid-img-active" src="img/eva_logo.png"/></a>&nbsp;' +
                        '<a href="http://www.ensembl.org/Homo_sapiens/Variation/Explore?vdb=variation;v={id}" target="_blank"><img alt="" src="http://static.ensembl.org/i/search/ensembl.gif"></a>' +
                        '&nbsp;<a href="http://www.ncbi.nlm.nih.gov/SNP/snp_ref.cgi?searchType=adhoc_search&type=rs&rs={id}" target="_blank"><span>dbSNP</span></a>' +
                        '<tpl else><a href="?variant={chromosome}:{start}:{reference}:{alternate}" target="_blank"><img class="eva-grid-img-active" src="img/eva_logo.png"/></a>&nbsp;<img alt="" class="eva-grid-img-inactive " src="http://static.ensembl.org/i/search/ensembl.gif">&nbsp;<span  style="opacity:0.2" class="eva-grid-img-inactive ">dbSNP</span></tpl>',
                    flex: 0.3,
                }

                //
            ],
            defaults: {
//                flex: 1,
                align:'left' ,
                sortable : false,
                menuDisabled:true
            }
        } ;

        var attributes = [
            {name: 'id', type: 'string'},
            {name: "chromosome", type: "string"},
            {name: "start", type: "int"},
            {name: "end", type: "int"},
            {name: "type", type: "string"},
            {name: "ref", type: "string"},
            {name: "alt", type: "string"},
            {name: 'hgvs_name', type: 'string'},
//            {name: 'id', mapping: 'annotation.xrefs[0].id', type: 'string' },
            {name: 'consequenceTypes', mapping: 'annotation.consequenceTypes', type:'auto' },
//            {name: 'conservedRegionScores', mapping: 'annotation.conservedRegionScores', type:'auto'},
//            {name: 'phylop',  mapping: 'annotation.conservedRegionScores', type:'auto'},
//            {name: 'phastCons', mapping: 'annotation.conservedRegionScores', type:'auto'}
        ];


        var listeners = {
            expandbody: function (expander, record, body, rowIndex) {
                var content = '';
                var consequenceTypes = record.data.consequenceTypes;
                for (i = 0; i < consequenceTypes.length; i++) {
                    content += '<div><a href="http://www.sequenceontology.org/miso/current_svn/term/' + consequenceTypes[i].soTerms[0].soAccession + '" target="_blank">' + consequenceTypes[i].soTerms[0].soAccession + '</a>:&nbsp;' + consequenceTypes[i].soTerms[0].soName + '</div>'
                }
                body.innerHTML = content;
            }
        };

        var plugins = [{
            ptype: 'rowexpander',
            rowBodyTpl: new Ext.XTemplate()
        }];

        var variantBrowserGrid = new EvaVariantBrowserGrid({
            title: this.browserGridConfig.title,
            target: target,
            data: this.data,
            height: 480,
            margin: '0 0 0 0',
            border: this.browserGridConfig.border,
            dataParser: this.dataParser,
            responseRoot: this.responseRoot,
            responseTotal: this.responseTotal,
            responseParser: this.responseParser,
            startParam: this.startParam,
            attributes: attributes,
            columns: columns,
            samples: this.samples,
            headerConfig: this.headerConfig,
//            plugins:plugins,
            handlers: {
                "variant:change": function (e) {
                    _this.lastVariant = e.args;
                    _this.trigger('variant:change', {variant: _this.lastVariant, sender: _this});
                },
                "variant:clear": function (e) {
                    //_this.lastVariant = e.args;
                    _this.trigger('variant:clear', {sender: _this});
                },
                "species:change": function (e) {
                    alert('sef')
                }
            },
            viewConfigListeners: listeners

        });
        var resultsPerPage = new Ext.form.ComboBox({
            name: 'perpage',
            width: 70,
            store: new Ext.data.ArrayStore({
                fields: ['id'],
                data: [
                    ['10'],
                    ['25'],
                    ['50'],
                    ['75'],
                    ['100'],
                    ['200']
                ]
            }),
            mode: 'local',
            value: '10',
//            listWidth     : 40,
            triggerAction: 'all',
            displayField: 'id',
            valueField: 'id',
            editable: false,
            forceSelection: true
        });

        variantBrowserGrid.grid.addDocked({
            xtype: 'toolbar',
            dock: 'bottom',
            border: false,
            items: ['Results per Page: ', resultsPerPage, {
                xtype: 'button',
                text: 'Export as CSV',
                style: {
                    borderStyle: 'solid'
                },
                listeners: {
                    click: {
                        element: 'el', //bind to the underlying el property on the panel
                        fn: function () {
                            var proxy = variantBrowserGrid.grid.store.proxy;
                            var category = 'segments';
                            var query = proxy.extraParams.region;
                            if (proxy.extraParams.gene) {
                                category = 'genes';
                                query = proxy.extraParams.gene;
                            }
                            var url = EvaManager.url({
                                category: category,
                                resource: 'variants',
                                query: query,
//                                params:{merge:true,exclude:'files'}
                                params: {merge: true, exclude: 'sourceEntries'}
                            });
                            proxy.url = url;
                            var exportStore = Ext.create('Ext.data.Store', {
                                pageSize: variantBrowserGrid.grid.store.getTotalCount(),
                                autoLoad: true,
                                fields: [
                                    {name: 'id', type: 'string'}
                                ],
                                remoteSort: true,
                                proxy: proxy,
                                extraParams: {exclude: files},
                                listeners: {
                                    load: function (store, records, successful, operation, eOpts) {
                                        var exportData = _this._exportToExcel(records, store.proxy.extraParams);
                                        variantBrowserGrid.grid.setLoading(false);

                                    }
                                }

                            });
                        }
                    }
                }
            }]
        });

        resultsPerPage.on('select', function (combo, record) {
            var _this = this;
            var url = variantBrowserGrid.store.proxy.url;
            var params = variantBrowserGrid.store.proxy.extraParams;
//            variantBrowserGrid.pageSize = record[0].id;
            variantBrowserGrid.pageSize = record.id;
            _this.retrieveData(url, params);
        }, this);


        return variantBrowserGrid;
    },

    _createVariantEffectGrid: function (target) {
        var _this = this;
        var variantEffectGrid = new VariantEffectGrid({
            target: target,
            headerConfig: this.defaultToolConfig.headerConfig,
            gridConfig: {
                flex: 1,
                layout: {
                    align: 'stretch'
                }
            },
            handlers: {
                "load:finish": function (e) {
                }
            }
        });

        this.variantBrowserGrid.on("variant:clear", function (e) {
            variantEffectGrid.clear(true);
        });

        this.on("variant:change", function (e) {
            if (target === _this.selectedToolDiv) {
                var variant = e.variant;
                var effectData = _this._loadExampleData();

                variantEffectGrid.load(effectData);
            }

        });
        return variantEffectGrid;
    },
    _createVariantStatsPanel: function (target) {
        var _this = this;
        var variantStatsPanel = new EvaVariantStatsPanel({
            target: target,
            headerConfig: this.defaultToolConfig.headerConfig,
            handlers: {
                "load:finish": function (e) {
//                    _this.grid.setLoading(false);
                }
            },
            height: 820,
            statsTpl: new Ext.XTemplate(
                '<table class="ocb-attributes-table">' +
                '<tr>' +
                '<td class="header">Minor Allele Frequency</td>' +
//                    '<td class="header">Minor Genotype Frequency</td>' +
                '<td class="header">Mendelian Errors</td>' +
                '<td class="header">Missing Alleles</td>' +
                '<td class="header">Missing Genotypes</td>' +
                '</tr>',
                '<tr>' +
                '<td><tpl if="maf == -1 || maf == 0">NA <tpl else>{maf:number( "0.000" )} </tpl><tpl if="mafAllele">({mafAllele}) <tpl else></tpl></td>' +
//                    '<td><tpl if="mgf == -1 || mgf == 0">NA <tpl else>{mgf:number( "0.000" )} </tpl><tpl if="mgfGenotype">({mgfGenotype}) <tpl else></tpl></td>' +
                '<td><tpl if="mendelianErrors == -1">NA <tpl else>{mendelianErrors}</tpl></td>' +
                '<td><tpl if="missingAlleles == -1">NA <tpl else>{missingAlleles}</tpl></td>' +
                '<td><tpl if="missingGenotypes == -1">NA <tpl else>{missingGenotypes}</tpl></td>' +
                '</tr>',
                '</table>'
            )
        });

        this.variantBrowserGrid.on("variant:clear", function (e) {
            variantStatsPanel.clear(true);
        });

        this.on("variant:change", function (e) {
            if (_.isUndefined(e.variant)) {
                variantStatsPanel.clear(true);
            } else {
//                if (target === _this.selectedToolDiv) {
                if (target.id === _this.selectedToolDiv.id) {
                    var variant = e.variant;
                    var region = variant.chromosome + ':' + variant.start + '-' + variant.end;
                    var proxy = _.clone(this.variantBrowserGrid.store.proxy);
//                proxy.extraParams.region = region;
                    EvaManager.get({
                        category: 'segments',
                        resource: 'variants',
                        query: region,
//                        params:proxy.extraParams,
                        params: {species: proxy.extraParams.species},
                        async: false,
                        success: function (response) {
                            try {
                                _.extend(variant, response.response[0].result[0])
                            } catch (e) {
                                console.log(e);
                            }

                        }
                    });
                    if (variant.sourceEntries) {
//                        variantStatsPanel.load(variant.sourceEntries,proxy.extraParams);
                        variantStatsPanel.load(variant.sourceEntries, {species: proxy.extraParams.species});
                    }
                }
            }

        });
        return variantStatsPanel;
    },
    _createVariantRawDataPanel: function (target) {
        var _this = this;
        var variantRawDataPanel = new VariantRawDataPanel({
            target: target,
            headerConfig: this.defaultToolConfig.headerConfig,
            handlers: {
                "load:finish": function (e) {
//                    _this.grid.setLoading(false);
                }
            },
            height: 800,
            statsTpl: new Ext.XTemplate(
                '<table class="table table-bordered ocb-attributes-table">' +
                '<tr>' +
                '<td class="header">Minor Allele Frequency</td>' +
//                    '<td class="header">Minor Genotype Frequency</td>' +
                '<td class="header">Mendelian Errors</td>' +
                '<td class="header">Missing Alleles</td>' +
                '<td class="header">Missing Genotypes</td>' +
                '</tr>',
                '<tr>' +
                '<td><tpl if="maf == -1 || maf == 0">NA <tpl else>{maf:number( "0.000" )} </tpl><tpl if="mafAllele">({mafAllele}) <tpl else></tpl></td>' +
//                    '<td><tpl if="mgf == -1 || mgf == 0">NA <tpl else>{mgf:number( "0.000" )} </tpl><tpl if="mgfGenotype">({mgfGenotype}) <tpl else></tpl></td>' +
                '<td><tpl if="mendelianErrors == -1">NA <tpl else>{mendelianErrors}</tpl></td>' +
                '<td><tpl if="missingAlleles == -1">NA <tpl else>{missingAlleles}</tpl></td>' +
                '<td><tpl if="missingGenotypes == -1">NA <tpl else>{missingGenotypes}</tpl></td>' +
                '</tr>',
                '</table>'
            )
        });

        this.variantBrowserGrid.on("variant:clear", function (e) {
            variantRawDataPanel.clear(true);
        });

        this.on("variant:change", function (e) {
            if (target === _this.selectedToolDiv) {
                var variant = e.variant;
                if (variant.sourceEntries) {
                    variantRawDataPanel.load(variant.sourceEntries);
                }
            }
        });
        return variantRawDataPanel;
    },

    _createAnnotPanel: function (target) {
        var _this = this;
        var annotPanel = new ClinvarAnnotationPanel({
            target: target,
            height:800,
            headerConfig: this.defaultToolConfig.headerConfig,
            handlers: {
                "load:finish": function (e) {
//                    _this.grid.setLoading(false);
                }
            }

        });

        this.variantBrowserGrid.on("variant:clear", function (e) {
            annotPanel.clear(true);
        });

        this.on("variant:change", function (e) {
//            if (target === _this.selectedToolDiv) {
            if(_.isUndefined(e.variant)){
                annotPanel.clear(true);
            }else{
                if (target.id === _this.selectedToolDiv.id) {
                    _.extend(e.variant, {annot: e.variant.annotation});
                    console.log(e.variant)
                    annotPanel.load(e.variant);
                }
            }
        });

        return annotPanel;
    },

    _createVariantPopulationStatsPanel: function (target) {
        var _this = this;
        var variantPopulationStatsPanel = new EvaVariantPopulationStatsPanel({
            target: target,
            headerConfig: this.defaultToolConfig.headerConfig,
            handlers: {
                "load:finish": function (e) {
//                    _this.grid.setLoading(false);
                }
            },
            height: 820,
            statsTpl: new Ext.XTemplate(
                '<table class="ocb-attributes-table">' +
                '<tr>' +
                '<td class="header">Minor Allele Frequency</td>' +
//                    '<td class="header">Minor Genotype Frequency</td>' +
                '<td class="header">Mendelian Errors</td>' +
                '<td class="header">Missing Alleles</td>' +
                '<td class="header">Missing Genotypes</td>' +
                '</tr>',
                '<tr>' +
                '<td><tpl if="maf == -1 || maf == 0">NA <tpl else>{maf:number( "0.000" )} </tpl><tpl if="mafAllele">({mafAllele}) <tpl else></tpl></td>' +
//                    '<td><tpl if="mgf == -1 || mgf == 0">NA <tpl else>{mgf:number( "0.000" )} </tpl><tpl if="mgfGenotype">({mgfGenotype}) <tpl else></tpl></td>' +
                '<td><tpl if="mendelianErrors == -1">NA <tpl else>{mendelianErrors}</tpl></td>' +
                '<td><tpl if="missingAlleles == -1">NA <tpl else>{missingAlleles}</tpl></td>' +
                '<td><tpl if="missingGenotypes == -1">NA <tpl else>{missingGenotypes}</tpl></td>' +
                '</tr>',
                '</table>'
            )
        });

        this.variantBrowserGrid.on("variant:clear", function (e) {
            variantPopulationStatsPanel.clear(true);
        });

        this.on("variant:change", function (e) {
            if (_.isUndefined(e.variant)) {
                variantPopulationStatsPanel.clear(true);
            } else {
//                if (target === _this.selectedToolDiv) {
                if (target.id === _this.selectedToolDiv.id) {
                    var variant = e.variant;
                    var region = variant.chromosome + ':' + variant.start + '-' + variant.end;
                    var proxy = _.clone(this.variantBrowserGrid.store.proxy);
//                proxy.extraParams.region = region;
                    EvaManager.get({
                        category: 'segments',
                        resource: 'variants',
                        query: region,
                        params: proxy.extraParams,
                        async: false,
                        success: function (response) {
                            try {
                                _.extend(variant, response.response[0].result[0])
                            } catch (e) {
                                console.log(e);
                            }

                        }
                    });
                    if (variant.sourceEntries) {
                        variantPopulationStatsPanel.load(variant.sourceEntries, proxy.extraParams);
                    }
                }
            }

        });
        return variantPopulationStatsPanel;
    },
    _createVariantGenotypeGrid: function (target) {
        var _this = this;
        var genotypeColumns = [
            {
                text: "Study",
                dataIndex: "studyId",
                flex: 1,
                xtype: 'templatecolumn',
                tpl: '<tpl if="reference">{reference}<tpl else>-</tpl>/<tpl if="alternate">{alternate}<tpl else>-</tpl>',

            },
            {
                text: "Samples Count",
                dataIndex: "samplesData",
                flex: 1
            }
        ];

        var variantGenotypeGrid = new EvaVariantGenotypeGrid({
            target: target,
            headerConfig: this.defaultToolConfig.headerConfig,
            gridConfig: {
                flex: 1,
                layout: {
                    align: 'stretch'
                }
            },
            height: 800,
            handlers: {
                "load:finish": function (e) {

                }
            },
//            columns:genotypeColumns
        });

        this.variantBrowserGrid.on("variant:clear", function (e) {
            variantGenotypeGrid.clear(true);
        });

        _this.on("variant:change", function (e) {
            if (_.isUndefined(e.variant)) {
                variantGenotypeGrid.clear(true);
            } else {
//                if (target === _this.selectedToolDiv) {
                if (target.id === _this.selectedToolDiv.id) {
                    var variant = e.variant;
                    var query = e.variant.chromosome + ':' + e.variant.start + '-' + e.variant.end;
                    var params = _.omit(this.variantBrowserGrid.store.proxy.extraParams, 'region', 'studies');

                    EvaManager.get({
                        category: 'segments',
                        resource: 'variants',
                        query: query,
                        params: params,
                        success: function (response) {
                            try {

                                var variantSourceEntries = response.response[0].result[0].sourceEntries;

                            } catch (e) {

                                console.log(e);
                            }

                            if (variantSourceEntries) {
                                variantGenotypeGrid.load(variantSourceEntries);
                            }

                        }
                    });

                }
            }

        });

        return variantGenotypeGrid;
    },


    _createGenomeViewer: function (target) {
        var _this = this;


        var region = new Region({
            chromosome: "13",
            start: 32889611,
            end: 32889611
        });

        var genomeViewer = new GenomeViewer({
            cellBaseHost:CELLBASE_HOST,
            sidePanel: false,
            target: target,
            border: false,
            resizable: true,
            width: this.width,
            region: region,
            availableSpecies: AVAILABLE_SPECIES,
            trackListTitle: '',
            drawNavigationBar: true,
            drawKaryotypePanel: true,
            drawChromosomePanel: true,
            drawRegionOverviewPanel: true,
            overviewZoomMultiplier: 50,
            karyotypePanelConfig: {
                collapsed: true,
                collapsible: true
            },
            navigationBarConfig: {
                componentsConfig: {
                    restoreDefaultRegionButton: false,
                    regionHistoryButton: false,
                    speciesButton: false,
                    chromosomesButton: false,
                    karyotypeButtonLabel: false,
                    chromosomeButtonLabel: false,
                    //regionButton: false,
//                    zoomControl: false,
                    windowSizeControl: false,
//                    positionControl: false,
//                    moveControl: false,
//                    autoheightButton: false,
//                    compactButton: false,
//                    searchControl: false
                }
            }
        });
        genomeViewer.setZoom(80);

        var renderer = new FeatureRenderer(FEATURE_TYPES.gene);
        renderer.on({
            'feature:click': function (event) {
                // feature click event example
                console.log(event)
            }
        });
        var geneOverview = new FeatureTrack({
//        title: 'Gene overview',
            minHistogramRegionSize: 20000000,
            maxLabelRegionSize: 10000000,
            height: 100,

            renderer: renderer,

            dataAdapter: new CellBaseAdapter({
                category: "genomic",
                subCategory: "region",
                resource: "gene",
                params: {
                    exclude: 'transcripts,chunkIds'
                },
                species: genomeViewer.species,
                cacheConfig: {
                    chunkSize: 100000
                }
            })
        });


        var sequence = new SequenceTrack({
//        title: 'Sequence',
            height: 30,
            visibleRegionSize: 200,

            renderer: new SequenceRenderer(),

            dataAdapter: new SequenceAdapter({
                category: "genomic",
                subCategory: "region",
                resource: "sequence",
                species: genomeViewer.species
            })
        });


        var gene = new GeneTrack({
            title: 'Gene',
            minHistogramRegionSize: 20000000,
            maxLabelRegionSize: 10000000,
            minTranscriptRegionSize: 200000,
            height: 60,

            renderer: new GeneRenderer(),

            dataAdapter: new CellBaseAdapter({
                category: "genomic",
                subCategory: "region",
                resource: "gene",
                species: genomeViewer.species,
                params: {
                    exclude: 'transcripts.tfbs,transcripts.xrefs,transcripts.exons.sequence'
                },
                cacheConfig: {
                    chunkSize: 100000
                }
            })
        });

        var snp = new FeatureTrack({
            title: 'SNP',
            featureType: 'SNP',
            minHistogramRegionSize: 10000,
            maxLabelRegionSize: 3000,
            height: 100,

            renderer: new FeatureRenderer(FEATURE_TYPES.snp),

            dataAdapter: new CellBaseAdapter({
                category: "genomic",
                subCategory: "region",
                resource: "snp",
                params: {
                    exclude: 'transcriptVariations,xrefs,samples'
                },
                species: genomeViewer.species,
                cacheConfig: {
                    chunkSize: 10000
                }
            })
        });

        genomeViewer.addOverviewTrack(geneOverview);
        genomeViewer.addTrack([sequence, gene, snp]);
        this.on("species:change", function (e) {
            _this.taxonomy = e.values.species.split('_')[0];
            //if (target === _this.selectedToolDiv) {
            //}
        });
        this.on("variant:change", function (e) {
            if (e.variant) {
                if (target === _this.selectedToolDiv) {
                    var variant = e.variant;

                    var region = new Region(variant);
                    if (!_.isUndefined(genomeViewer)) {
                        genomeViewer.setRegion(region, _this.taxonomy);
                    }
                }
            } else {
                genomeViewer.setSpeciesByTaxonomy(_this.taxonomy);
            }
        });

        return genomeViewer;
    },
    retrieveData: function (baseUrl, filterParams) {
        this.variantBrowserGrid.loadUrl(baseUrl, filterParams);
    },
    setLoading: function (loading) {
        this.variantBrowserGrid.setLoading(loading);
    },
    _loadExampleData: function () {
        var data = {
                "chromosome": "1",
                "start": 10001,
                "end": 10001,
                "referenceAllele": "T",
                "genes": [],
                "effects": {
                    "G": [
                        {
                            "allele": "G",
                            "geneId": "ENSG00000223972",
                            "geneName": "DDX11L1",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000456328",
                            "featureType": "Transcript",
                            "featureBiotype": "processed_transcript",
                            "featureStrand": "1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1631],
                            "canonical": true,
                            "variantToTranscriptDistance": 1868
                        },
                        {
                            "allele": "G",
                            "geneId": "ENSG00000227232",
                            "geneName": "WASH7P",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000488147",
                            "featureType": "Transcript",
                            "featureBiotype": "unprocessed_pseudogene",
                            "featureStrand": "-1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1632],
                            "canonical": false,
                            "variantToTranscriptDistance": 4403
                        },
                        {
                            "allele": "G",
                            "geneId": "ENSG00000227232",
                            "geneName": "WASH7P",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000541675",
                            "featureType": "Transcript",
                            "featureBiotype": "unprocessed_pseudogene",
                            "featureStrand": "-1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1632],
                            "canonical": false,
                            "variantToTranscriptDistance": 4362
                        },
                        {
                            "allele": "G",
                            "geneId": "ENSG00000223972",
                            "geneName": "DDX11L1",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000450305",
                            "featureType": "Transcript",
                            "featureBiotype": "transcribed_unprocessed_pseudogene",
                            "featureStrand": "1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1631],
                            "canonical": false,
                            "variantToTranscriptDistance": 2009
                        },
                        {
                            "allele": "G",
                            "geneId": "ENSG00000223972",
                            "geneName": "DDX11L1",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000515242",
                            "featureType": "Transcript",
                            "featureBiotype": "transcribed_unprocessed_pseudogene",
                            "featureStrand": "1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1631],
                            "canonical": false,
                            "variantToTranscriptDistance": 1871
                        },
                        {
                            "allele": "G",
                            "geneId": "ENSG00000227232",
                            "geneName": "WASH7P",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000538476",
                            "featureType": "Transcript",
                            "featureBiotype": "unprocessed_pseudogene",
                            "featureStrand": "-1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1632],
                            "canonical": false,
                            "variantToTranscriptDistance": 4410
                        },
                        {
                            "allele": "G",
                            "geneId": "ENSG00000223972",
                            "geneName": "DDX11L1",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000518655",
                            "featureType": "Transcript",
                            "featureBiotype": "transcribed_unprocessed_pseudogene",
                            "featureStrand": "1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1631],
                            "canonical": false,
                            "variantToTranscriptDistance": 1873
                        },
                        {
                            "allele": "G",
                            "geneId": "ENSG00000227232",
                            "geneName": "WASH7P",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000438504",
                            "featureType": "Transcript",
                            "featureBiotype": "unprocessed_pseudogene",
                            "featureStrand": "-1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1632],
                            "canonical": true,
                            "variantToTranscriptDistance": 4362
                        },
                        {
                            "allele": "G",
                            "geneId": "ENSG00000227232",
                            "geneName": "WASH7P",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000423562",
                            "featureType": "Transcript",
                            "featureBiotype": "unprocessed_pseudogene",
                            "featureStrand": "-1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1632],
                            "canonical": false,
                            "variantToTranscriptDistance": 4362
                        },
                        {
                            "allele": "G",
                            "featureId": "ENSR00000668495",
                            "featureType": "RegulatoryFeature",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1566],
                            "canonical": false,
                            "variantToTranscriptDistance": -1
                        }
                    ], "A": [
                        {
                            "allele": "A",
                            "geneId": "ENSG00000223972",
                            "geneName": "DDX11L1",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000456328",
                            "featureType": "Transcript",
                            "featureBiotype": "processed_transcript",
                            "featureStrand": "1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1631],
                            "canonical": true,
                            "variantToTranscriptDistance": 1868
                        },
                        {
                            "allele": "A",
                            "geneId": "ENSG00000227232",
                            "geneName": "WASH7P",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000488147",
                            "featureType": "Transcript",
                            "featureBiotype": "unprocessed_pseudogene",
                            "featureStrand": "-1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1632],
                            "canonical": false,
                            "variantToTranscriptDistance": 4403
                        },
                        {
                            "allele": "A",
                            "geneId": "ENSG00000227232",
                            "geneName": "WASH7P",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000541675",
                            "featureType": "Transcript",
                            "featureBiotype": "unprocessed_pseudogene",
                            "featureStrand": "-1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1632],
                            "canonical": false,
                            "variantToTranscriptDistance": 4362
                        },
                        {
                            "allele": "A",
                            "geneId": "ENSG00000223972",
                            "geneName": "DDX11L1",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000450305",
                            "featureType": "Transcript",
                            "featureBiotype": "transcribed_unprocessed_pseudogene",
                            "featureStrand": "1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1631],
                            "canonical": false,
                            "variantToTranscriptDistance": 2009
                        },
                        {
                            "allele": "A",
                            "geneId": "ENSG00000223972",
                            "geneName": "DDX11L1",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000515242",
                            "featureType": "Transcript",
                            "featureBiotype": "transcribed_unprocessed_pseudogene",
                            "featureStrand": "1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1631],
                            "canonical": false,
                            "variantToTranscriptDistance": 1871
                        },
                        {
                            "allele": "A",
                            "geneId": "ENSG00000227232",
                            "geneName": "WASH7P",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000538476",
                            "featureType": "Transcript",
                            "featureBiotype": "unprocessed_pseudogene",
                            "featureStrand": "-1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1632],
                            "canonical": false,
                            "variantToTranscriptDistance": 4410
                        },
                        {
                            "allele": "A",
                            "geneId": "ENSG00000223972",
                            "geneName": "DDX11L1",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000518655",
                            "featureType": "Transcript",
                            "featureBiotype": "transcribed_unprocessed_pseudogene",
                            "featureStrand": "1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1631],
                            "canonical": false,
                            "variantToTranscriptDistance": 1873
                        },
                        {
                            "allele": "A",
                            "geneId": "ENSG00000227232",
                            "geneName": "WASH7P",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000438504",
                            "featureType": "Transcript",
                            "featureBiotype": "unprocessed_pseudogene",
                            "featureStrand": "-1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1632],
                            "canonical": true,
                            "variantToTranscriptDistance": 4362
                        },
                        {
                            "allele": "A",
                            "geneId": "ENSG00000227232",
                            "geneName": "WASH7P",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000423562",
                            "featureType": "Transcript",
                            "featureBiotype": "unprocessed_pseudogene",
                            "featureStrand": "-1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1632],
                            "canonical": false,
                            "variantToTranscriptDistance": 4362
                        },
                        {
                            "allele": "A",
                            "featureId": "ENSR00000668495",
                            "featureType": "RegulatoryFeature",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1566],
                            "canonical": false,
                            "variantToTranscriptDistance": -1
                        }
                    ], "C": [
                        {
                            "allele": "C",
                            "geneId": "ENSG00000223972",
                            "geneName": "DDX11L1",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000456328",
                            "featureType": "Transcript",
                            "featureBiotype": "processed_transcript",
                            "featureStrand": "1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1631],
                            "canonical": true,
                            "variantToTranscriptDistance": 1868
                        },
                        {
                            "allele": "C",
                            "geneId": "ENSG00000227232",
                            "geneName": "WASH7P",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000488147",
                            "featureType": "Transcript",
                            "featureBiotype": "unprocessed_pseudogene",
                            "featureStrand": "-1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1632],
                            "canonical": false,
                            "variantToTranscriptDistance": 4403
                        },
                        {
                            "allele": "C",
                            "geneId": "ENSG00000227232",
                            "geneName": "WASH7P",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000541675",
                            "featureType": "Transcript",
                            "featureBiotype": "unprocessed_pseudogene",
                            "featureStrand": "-1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1632],
                            "canonical": false,
                            "variantToTranscriptDistance": 4362
                        },
                        {
                            "allele": "C",
                            "geneId": "ENSG00000223972",
                            "geneName": "DDX11L1",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000450305",
                            "featureType": "Transcript",
                            "featureBiotype": "transcribed_unprocessed_pseudogene",
                            "featureStrand": "1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1631],
                            "canonical": false,
                            "variantToTranscriptDistance": 2009
                        },
                        {
                            "allele": "C",
                            "geneId": "ENSG00000223972",
                            "geneName": "DDX11L1",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000515242",
                            "featureType": "Transcript",
                            "featureBiotype": "transcribed_unprocessed_pseudogene",
                            "featureStrand": "1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1631],
                            "canonical": false,
                            "variantToTranscriptDistance": 1871
                        },
                        {
                            "allele": "C",
                            "geneId": "ENSG00000227232",
                            "geneName": "WASH7P",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000538476",
                            "featureType": "Transcript",
                            "featureBiotype": "unprocessed_pseudogene",
                            "featureStrand": "-1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1632],
                            "canonical": false,
                            "variantToTranscriptDistance": 4410
                        },
                        {
                            "allele": "C",
                            "geneId": "ENSG00000223972",
                            "geneName": "DDX11L1",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000518655",
                            "featureType": "Transcript",
                            "featureBiotype": "transcribed_unprocessed_pseudogene",
                            "featureStrand": "1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1631],
                            "canonical": false,
                            "variantToTranscriptDistance": 1873
                        },
                        {
                            "allele": "C",
                            "geneId": "ENSG00000227232",
                            "geneName": "WASH7P",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000438504",
                            "featureType": "Transcript",
                            "featureBiotype": "unprocessed_pseudogene",
                            "featureStrand": "-1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1632],
                            "canonical": true,
                            "variantToTranscriptDistance": 4362
                        },
                        {
                            "allele": "C",
                            "geneId": "ENSG00000227232",
                            "geneName": "WASH7P",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000423562",
                            "featureType": "Transcript",
                            "featureBiotype": "unprocessed_pseudogene",
                            "featureStrand": "-1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1632],
                            "canonical": false,
                            "variantToTranscriptDistance": 4362
                        },
                        {
                            "allele": "C",
                            "featureId": "ENSR00000668495",
                            "featureType": "RegulatoryFeature",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1566],
                            "canonical": false,
                            "variantToTranscriptDistance": -1
                        }
                    ], "-": [
                        {
                            "allele": "-",
                            "geneId": "ENSG00000223972",
                            "geneName": "DDX11L1",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000456328",
                            "featureType": "Transcript",
                            "featureBiotype": "processed_transcript",
                            "featureStrand": "1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1631],
                            "canonical": true,
                            "variantToTranscriptDistance": 1868
                        },
                        {
                            "allele": "-",
                            "geneId": "ENSG00000227232",
                            "geneName": "WASH7P",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000488147",
                            "featureType": "Transcript",
                            "featureBiotype": "unprocessed_pseudogene",
                            "featureStrand": "-1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1632],
                            "canonical": false,
                            "variantToTranscriptDistance": 4403
                        },
                        {
                            "allele": "-",
                            "geneId": "ENSG00000227232",
                            "geneName": "WASH7P",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000541675",
                            "featureType": "Transcript",
                            "featureBiotype": "unprocessed_pseudogene",
                            "featureStrand": "-1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1632],
                            "canonical": false,
                            "variantToTranscriptDistance": 4362
                        },
                        {
                            "allele": "-",
                            "geneId": "ENSG00000223972",
                            "geneName": "DDX11L1",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000450305",
                            "featureType": "Transcript",
                            "featureBiotype": "transcribed_unprocessed_pseudogene",
                            "featureStrand": "1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1631],
                            "canonical": false,
                            "variantToTranscriptDistance": 2009
                        },
                        {
                            "allele": "-",
                            "geneId": "ENSG00000223972",
                            "geneName": "DDX11L1",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000515242",
                            "featureType": "Transcript",
                            "featureBiotype": "transcribed_unprocessed_pseudogene",
                            "featureStrand": "1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1631],
                            "canonical": false,
                            "variantToTranscriptDistance": 1871
                        },
                        {
                            "allele": "-",
                            "geneId": "ENSG00000227232",
                            "geneName": "WASH7P",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000538476",
                            "featureType": "Transcript",
                            "featureBiotype": "unprocessed_pseudogene",
                            "featureStrand": "-1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1632],
                            "canonical": false,
                            "variantToTranscriptDistance": 4410
                        },
                        {
                            "allele": "-",
                            "geneId": "ENSG00000223972",
                            "geneName": "DDX11L1",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000518655",
                            "featureType": "Transcript",
                            "featureBiotype": "transcribed_unprocessed_pseudogene",
                            "featureStrand": "1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1631],
                            "canonical": false,
                            "variantToTranscriptDistance": 1873
                        },
                        {
                            "allele": "-",
                            "geneId": "ENSG00000227232",
                            "geneName": "WASH7P",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000438504",
                            "featureType": "Transcript",
                            "featureBiotype": "unprocessed_pseudogene",
                            "featureStrand": "-1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1632],
                            "canonical": true,
                            "variantToTranscriptDistance": 4362
                        },
                        {
                            "allele": "-",
                            "geneId": "ENSG00000227232",
                            "geneName": "WASH7P",
                            "geneNameSource": "HGNC",
                            "featureId": "ENST00000423562",
                            "featureType": "Transcript",
                            "featureBiotype": "unprocessed_pseudogene",
                            "featureStrand": "-1",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1632],
                            "canonical": false,
                            "variantToTranscriptDistance": 4362
                        },
                        {
                            "allele": "-",
                            "featureId": "ENSR00000668495",
                            "featureType": "RegulatoryFeature",
                            "cDnaPosition": -1,
                            "cdsPosition": -1,
                            "proteinPosition": -1,
                            "consequenceTypes": [1566],
                            "canonical": false,
                            "variantToTranscriptDistance": -1
                        }
                    ]
                },
                "frequencies": {
                    "maf1000G": 0.6,
                    "maf1000GAfrican": 0.5,
                    "maf1000GAmerican": 0.4,
                    "maf1000GAsian": 0.3,
                    "maf1000GEuropean": 0.2,
                    "mafNhlbiEspAfricanAmerican": 0.1,
                    "mafNhlbiEspEuropeanAmerican": 0.2
                },
                "proteinSubstitutionScores": {"polyphenScore": -1.0, "siftScore": -1.0},
                "regulatoryEffect": {"motifPosition": 0, "motifScoreChange": 0.0, "highInformationPosition": false}
            }
            ;
        return data
    },
    _exportToExcel: function (records, params) {
        var csvContent = '',
        /*
         Does this browser support the download attribute
         in HTML 5, if so create a comma seperated value
         file from the selected records / if not create
         an old school HTML table that comes up in a
         popup window allowing the users to copy and paste
         the rows.
         */
            noCsvSupport = ( 'download' in document.createElement('a') ) ? false : true,
            sdelimiter = noCsvSupport ? "<td>" : "",
            edelimiter = noCsvSupport ? "</td>" : ",",
            snewLine = noCsvSupport ? "<tr>" : "",
            enewLine = noCsvSupport ? "</tr>" : "\r\n",
            printableValue = '',
            speciesValue = '';

        csvContent += snewLine;

        /* Get the column headers from the store dataIndex */

        var removeKeys = ['hgvs', 'sourceEntries', 'ref', 'alt', 'hgvs_name', 'iid', 'annotation', 'ids', 'conservedRegionScores', 'length'];

        Ext.Object.each(records[0].data, function (key) {
            if (_.indexOf(removeKeys, key) == -1) {
                csvContent += sdelimiter + key + edelimiter;
            }
        });
        csvContent += sdelimiter + 'Organism / Assembly' + edelimiter;

        csvContent += enewLine;
        /*
         Loop through the selected records array and change the JSON
         object to teh appropriate format.
         */

        for (var i = 0; i < records.length; i++) {
            /* Put the record object in somma seperated format */
            csvContent += snewLine;
            Ext.Object.each(records[i].data, function (key, value) {
                if (key == 'consequenceTypes') {
                    var tempArray = [];
                    _.each(_.keys(value), function (key) {
                        var so_terms = this[key].soTerms;
                        _.each(_.keys(so_terms), function (key) {
                            tempArray.push(this[key].soName)
                        }, so_terms);
                    }, value);


                    var groupedArr = _.groupBy(tempArray);
                    var so_array = [];
                    _.each(_.keys(groupedArr), function (key) {
                        var index = _.indexOf(consequenceTypesHierarchy, key);
//                                        so_array.splice(index, 0, key+' ('+this[key].length+')');
//                                        so_array.push(key+' ('+this[key].length+')')
//                        so_array[index] = key + ' (' + this[key].length + ')';
                        so_array[index] = key;
                    }, groupedArr);
                    so_array = _.compact(so_array);
                    value = so_array.join(" ");
                    value = _.first(so_array);
                } else if (key == 'phylop') {
                    var phylop = _.findWhere(records[i].data[key], {source: key});
                    if (phylop) {
                        value = phylop.score.toFixed(3);
                    } else {
                        value = '';
                    }


                } else if (key == 'phastCons') {
                    var phastCons = _.findWhere(records[i].data[key], {source: key});
                    if (phastCons) {
                        value = phastCons.score.toFixed(3);
                    } else {
                        value = '';
                    }
                }

                if (_.indexOf(removeKeys, key) == -1) {
                    printableValue = ((noCsvSupport) && value == '') ? '&nbsp;' : value;
                    printableValue = String(printableValue).replace(/,/g, "");
                    printableValue = String(printableValue).replace(/(\r\n|\n|\r)/gm, "");
                    csvContent += sdelimiter + printableValue + edelimiter;
                }

            });


            var speciesName;
            var species;
            if (!_.isEmpty(speciesList)) {
                speciesName = _.findWhere(speciesList, {taxonomyCode: params.species.split("_")[0]}).taxonomyEvaName;
                species = speciesName.substr(0, 1).toUpperCase() + speciesName.substr(1) + '/' + _.findWhere(speciesList, {assemblyCode: params.species.split('_')[1]}).assemblyName;

            } else {
                species = params.species;
            }

            speciesValue = ((noCsvSupport) && species == '') ? '&nbsp;' : species;
            speciesValue = String(species).replace(/,/g, "");
            speciesValue = String(speciesValue).replace(/(\r\n|\n|\r)/gm, "");
            csvContent += sdelimiter + speciesValue + edelimiter;
            csvContent += enewLine;
        }


        if ('download' in document.createElement('a')) {
            /*
             This is the code that produces the CSV file and downloads it
             to the users computer
             */
//            var link = document.createElement("a");
//            link.setAttribute("href", 'data:application/csv;charset=utf-8,' + encodeURIComponent(csvContent));
//            link.setAttribute("download", "variants.csv");
//            link.setAttribute("target", "_blank");
//            link.click();

            var link = document.createElement('a');
            var mimeType = 'application/xls';
            var blob = new Blob([csvContent], {type: mimeType});
            var url = URL.createObjectURL(blob);
            link.href = url;
            link.setAttribute('download', 'variants.csv');
            link.innerHTML = "Export to CSV";
            document.body.appendChild(link);
            link.click();

        } else {
            /*
             The values below get printed into a blank window for
             the luddites.
             */
            alert('Please allow pop up in settings if its not exporting');
            window.open().document.write('<table>' + csvContent + '</table>');
            return true;


        }

        return true;
    }
};
