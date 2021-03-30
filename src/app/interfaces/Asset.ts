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

/**
 * Asset interface
 * @interface Asset
 * @export Asset
 */
export default interface Asset {
  componentSerialNumbers: Array<string>;
  items: string;
  creationDate: string;
  manufacturer: string;
  partNameManufacturer: string;
  partNumberCustomer: string;
  partNumberManufacturer: string;
  productionCountryCodeManufacturer: string;
  productionDateGmt: string;
  qualityStatus: string;
  serialNumberCustomer: string;
  serialNumberManufacturer: string;
  status: string;
}
