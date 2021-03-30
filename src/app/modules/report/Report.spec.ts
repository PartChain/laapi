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

import Report from "./Report";

describe('Report Unit Tests', () => {
    const assets: any = [{
        "componentsSerialNumbers": [
            "Tesqweq15444"
        ],
        "childComponents": [
            {
                "childComponents": [
                    {
                        "childComponents": [],
                        "componentsSerialNumbers": [],
                    }
                ],
                "componentsSerialNumbers": [
                    "kind2345"
                ]
            }
        ]
    },
        {
            "componentsSerialNumbers": [
                "94817880721A034M05061A8",
                "94817870721B029M05543A9"
            ],
            "childComponents": [
                {
                    "childComponents": [],
                    "componentsSerialNumbers": [],
                },
                {
                    "childComponents": [],
                    "componentsSerialNumbers": [],
                }
            ]
        },
        {
            "componentsSerialNumbers": [],
            "childComponents": []
        }];

    const assets_with_two_subcomponents: any = [{
        "componentsSerialNumbers": [
            "Tesqweq15444"
        ],
        "childComponents": [
            {
                "childComponents": [
                    {
                        "childComponents": [],
                        "componentsSerialNumbers": ["qweqwe"],
                    }
                ],
                "componentsSerialNumbers": [
                    "kind2345"
                ]
            }
        ]
    },
        {
            "componentsSerialNumbers": [
                "94817880721A034M05061A8",
                "94817870721B029M05543A9"
            ],
            "childComponents": [
                {
                    "childComponents": [],
                    "componentsSerialNumbers": ["qweqwe"],
                },
                {
                    "childComponents": [],
                    "componentsSerialNumbers": ["dsgsdf"],
                }
            ]
        },
        {
            "componentsSerialNumbers": [],
            "childComponents": []
        }];

    const assets_with_no_subcomponents: any = [
        {
            "componentsSerialNumbers": [
                "94817880721A034M05061A8",
                "94817870721B029M05543A9"
            ],
            "childComponents": [
                {
                    "childComponents": [],
                    "componentsSerialNumbers": []
                },
                {
                    "childComponents": [],
                    "componentsSerialNumbers": [],
                }
            ]
        }
    ]

    test('calculateAssetsWithSubcomponents: 1 Assets with subcomponents', () => {
        const result = Report.calculateAssetsWithSubcomponents(assets)
        expect(result).toStrictEqual(1);
    });

    test('calculateAssetsWithSubcomponents: 0 Assets with subcomponents', () => {
        const result = Report.calculateAssetsWithSubcomponents(assets_with_no_subcomponents)
        expect(result).toStrictEqual(0);
    });

    test('calculateAssetsWithSubcomponents: 2 Assets with subcomponents', () => {
        const result = Report.calculateAssetsWithSubcomponents(assets_with_two_subcomponents)
        expect(result).toStrictEqual(2);
    });
});
