/*
 * Copyright 2021 The PartChain Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as Excel from 'excel4node';
import * as JSZip from 'jszip';
import Logger from '../logger/Logger'
import _ = require("lodash");

/**
 * @class Report
 */
class Report {
    /**
     * @param data
     * @param filter
     */
    getCustomsReportExcel(data: any, filter: any) {

        let reportType = 'Customs Report';
        let assetList = data['data'];
        let resultLength = data['resultLength'];
        const exportData = this.buildExportData(assetList);
        const vehiclesWithSubcomponents = this.calculateAssetsWithSubcomponents(assetList);

        Logger.info(`Build data for export to excel: ${exportData}`);
        return this.buildExcel(exportData, filter, resultLength, reportType, vehiclesWithSubcomponents);

    }

    /**
     * @param data
     * @param filter
     */
    getAssetListExcel(data: any, filter: any) {
        let reportType = 'AssetList';
        let assetList = data['data'];
        let resultLength = data['resultLength'];
        const vehiclesWithSubcomponents = this.calculateAssetsWithSubcomponents(assetList);
        assetList = assetList.map((o: object) => _.omit(o, ['childComponents']));

        // const {exportData,  vehiclesWithSubcomponents} = this.buildExportData(assetList);
        return this.buildExcel(assetList, filter, resultLength, reportType, vehiclesWithSubcomponents);
    }

    /**
     * @param data
     * @param filter
     */
    getCustomsReportCSV(data: any, filter: any) {
        let assetList = data['data'];
        let resultLength = data['resultLength'];
        const exportData = this.buildExportData(assetList);
        const vehiclesWithSubcomponents = this.calculateAssetsWithSubcomponents(assetList);
        Logger.info(`Result set of build export data: ${exportData}, Length:${exportData.length}`);
        return this.buildCSV(exportData, filter, resultLength, vehiclesWithSubcomponents);
    }

    /**
     * @param data
     * @param filter
     */
    getAssetListCSV(data: any, filter: any) {
        let assetList = data['data'];
        let resultLength = data['resultLength'];
        const vehiclesWithSubcomponents = this.calculateAssetsWithSubcomponents(assetList);
        assetList = assetList.map((o: object) => _.omit(o, ['childComponents']));

        if (resultLength > 0) {
            return this.buildCSV(assetList, filter, resultLength, vehiclesWithSubcomponents);
        } else {
            return Buffer.alloc(0);
        }
    }

    /**
     * build customs report data for export
     *
     * @param vehicles
     */
    protected buildExportData(vehicles: any) {
        Logger.info(`Called buildExportData`);

        try {
            const exportData: any[] = [];
            const componentsArray: any[] = [];
            for (const vehicle of vehicles) {

                if (vehicle.hasOwnProperty("childComponents")) {
                    for (const childComponent of vehicle.childComponents) {
                        if (childComponent.componentsSerialNumbers.length > 0) {


                            let subcomponentComponentsSerialNumbers: string[] = [];
                            // trim child components length
                            for (let sn of childComponent.componentsSerialNumbers) {
                                subcomponentComponentsSerialNumbers.push(sn.trim()); //.slice still unknown .slice(0, sn.length - 4)
                            }

                            let subcomponentComponentsSerialNumbersObject: any = {...subcomponentComponentsSerialNumbers};
                            // reassign keys
                            for (let oldKey of Object.keys({...subcomponentComponentsSerialNumbers})) {
                                subcomponentComponentsSerialNumbersObject['ChildComponent_' + oldKey] = subcomponentComponentsSerialNumbersObject[oldKey];
                                delete subcomponentComponentsSerialNumbersObject[oldKey];
                            }
                            const exportDataEntry = {
                                PartNumberCustomer: (childComponent.partNumberCustomer ? childComponent.partNumberCustomer.trim() : childComponent.partNumberManufacturer),
                                ComponentName: childComponent.partNameManufacturer.trim(),
                                VehicleType: vehicle.partNameManufacturer,
                                ...subcomponentComponentsSerialNumbersObject
                            };
                            componentsArray.push(JSON.stringify(exportDataEntry));
                        }
                    }
                }
            }
            const distinctEntries = [...new Set(componentsArray)];
            // let x = exportDataArray.map(x => x.PartNumberManufacturer);
            for (const distinctEntry of distinctEntries) {
                const combinedArray = {
                    ...JSON.parse(distinctEntry),
                    NumberOfEntries: componentsArray.filter(x => x === distinctEntry).length
                };
                exportData.push(combinedArray);
            }

            return exportData;
        } catch (error) {
            Logger.error(error);
        }
    }


    /**
     * build data for export to csv
     *
     * @param data
     * @param filter
     * @param resultLength
     * @param assetsWithSubcomponents
     */
    protected buildCSV(data: any, filter: JSON, resultLength: number, assetsWithSubcomponents: number) {
        Logger.info(`Called buildCSV`);

        //Build header section
        let filterKeys = Object.keys(filter);
        let filterValues = Object.values(filter).map((value) => value.value);
        filterKeys.push('Assets covered');
        filterValues.push(resultLength);

        filterKeys.push('Assets with subcomponents');
        filterValues.push(assetsWithSubcomponents);

        let headerCSV = [filterKeys.join(','), filterValues.join(',')];
        let filterCSVString = headerCSV.join('\r\n');

        if (data.length > 0) {
            //Build data section
            let dataKeys = Object.keys(data[0]);
            let dataValues = Object.values(data);
            let dataReplacer = (key: any, value: any) => {
                return value === null ? '' : value;
            };
            let dataCSV = dataValues.map((row: any) => {
                return dataKeys.map((fieldName) => {
                    return JSON.stringify(row[fieldName], dataReplacer)
                }).join(',');
            });
            dataCSV.unshift(dataKeys.join(','));
            let dataCSVString = dataCSV.join('\r\n');
            return [filterCSVString, dataCSVString]
        } else return [filterCSVString, ""];
    }

    /**
     * build data for export to csv
     *
     * @param data
     * @param filter
     * @param resultLength
     * @param reportType
     * @param assetsWithSubcomponents
     */
    protected buildExcel(data: any, filter: any, resultLength: number, reportType: string = '', assetsWithSubcomponents: number) {
        Logger.info(`Called buildExcel`);

        let workbook: any = new Excel.Workbook();

        let reportSheet = workbook.addWorksheet('Customs Report');

        //Set row and column sizes
        reportSheet.row(1).setHeight(100);
        reportSheet.column(1).setWidth(25);
        reportSheet.column(2).setWidth(40);
        reportSheet.column(3).setWidth(25);
        reportSheet.column(4).setWidth(25);
        reportSheet.column(5).setWidth(25);
        reportSheet.column(6).setWidth(25);


        //HEADER SECTION

        //Add image
        reportSheet.addImage({
            path: '/src/app/modules/report/PC_logo.png',
            type: 'picture',
            position: {
                type: 'oneCellAnchor',
                from: {
                    col: 1,
                    colOff: 0,
                    row: 1,
                    rowOff: 0,
                },
            },
        });

        reportSheet.cell(1, 2)
            .string('PartChain ' + reportType)
            .style({
                font: {
                    color: '#000000',
                    size: 24,
                    bold: true,
                }
            });


        //FILTER SECTION
        //Number of vehicles
        let offset = 3;
        reportSheet.cell(offset, 1)
            .string('Total of assets:')
            .style({
                font: {
                    bold: true
                }
            });

        //Set Filter Value
        reportSheet.cell(offset, 2)
            .string(resultLength.toString())
            .style({
                font: {
                    bold: false
                }
            });

        //Number of vehicles with subcomponents
        offset += 1;
        reportSheet.cell(offset, 1)
            .string('Assets with Subcomponents:')
            .style({
                font: {
                    bold: true
                }
            });

        //Set Filter Value
        reportSheet.cell(offset, 2)
            .string(assetsWithSubcomponents.toString())
            .style({
                font: {
                    bold: false
                }
            });

        //Set Filter Headline
        offset += 1;
        reportSheet.cell(offset, 1)
            .string('Filter Parameters:')
            .style({
                font: {
                    bold: true,
                    size: 18
                }
            });


        //Filter options
        offset += 1;
        if (Object.keys(filter).length > 0) {
            //FILTER SECTION
            let filterKeys: any = Object.keys(filter);
            let filterValues: any = Object.values(filter);
            for (let i in filterKeys) {

                //Set Filter Type
                reportSheet.cell(Number(i) + offset, 1)
                    .string(this.capitalizeFirstLetter(filterKeys[i]) + ':')
                    .style({
                        font: {
                            bold: true
                        }
                    });

                //Set Filter Value
                reportSheet.cell(Number(i) + offset, 2)
                    .string(this.capitalizeFirstLetter(filterValues[i]["value"]))
                    .style({
                        font: {
                            bold: false
                        }
                    });
            }
        }

        //DATA SECTION
        // reset offset
        offset = offset + Object.keys(filter).length + 1;
        if (!(!data || data.length === 0)) {
            // Set header
            let dataKeys = Object.keys(data[0]);
            for (let i in dataKeys) {

                if (dataKeys[i]) {
                    reportSheet.cell(offset, Number(i) + 1).string(this.capitalizeFirstLetter(String(dataKeys[i])));
                }
            }

            data.forEach((entry: { [s: string]: unknown; } | ArrayLike<unknown>) => {
                offset += 1;
                entry = Object.values(entry)
                for (let i in entry) {
                    if (entry[i]) {
                        reportSheet.cell(offset, Number(i) + 1).string(this.capitalizeFirstLetter(String(_.isObject(entry[i]) ? JSON.stringify(entry[i]) : entry[i])));
                    }
                }
            });
        }
        workbook.write('ExcelFile.xlsx');
        return workbook
    }

    protected capitalizeFirstLetter(string: string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    /**
     * @param reportSubject
     * @param reportFiles
     */
    async zipReport(reportSubject: string, reportFiles: string[] | Buffer) {
        Logger.info(`Called zipReport`);

        let zip = new JSZip();
        zip.file('Data_' + reportSubject, reportFiles[1]);
        zip.file('Filter_' + reportSubject, reportFiles[0]);
        return zip.generateAsync({type: "nodeBuffer"}).catch((error: any) => {
            return error;
        });
    }

    calculateAssetsWithSubcomponents(assets: Array<any>){
        return assets.filter(asset => (asset.hasOwnProperty("childComponents") && asset.childComponents.length > 0 )) //Filter all assets which no childComponents
            .map((asset: any) => asset.childComponents.reduce((total: number, x: any) => (x.componentsSerialNumbers.length > 0 ? 1 : 0), 0)) // Check with assets have subcomponents
            .reduce((a, b) => a + b, 0) //Calculate sum of assets with subcomponents

    }
}

export default new Report;
