/*
 * European Variation Archive (EVA) - Open-access database of all types of genetic
 * variation data from all species
 *
 * Copyright 2019 EMBL - European Bioinformatics Institute
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package uk.ac.ebi.eva.server.ws.ga4gh;

import uk.ac.ebi.eva.commons.beacon.models.Beacon;
import uk.ac.ebi.eva.commons.beacon.models.BeaconDataset;
import uk.ac.ebi.eva.commons.beacon.models.BeaconOrganization;

import java.util.List;

public class BeaconImpl implements Beacon {

    static final String ID = "uk.ac.ebi.eva";

    static final String NAME = "European Variation Archive Beacon";

    static final String APIVERSION = "v1.0";

    static final String DESCRIPTION = "descriptionString";

    static final String VERSION = "v2";

    static final String WELCOME_URL = "welcomeUrlString";

    static final String ALTERNATIVE_URL = "alternativeUrlString";

    static final String CREATED_DATE_TIME = "date1";

    static final String UPDATE_DATE_TIME = "date2";

    private String id;

    private String name;

    private String apiVersion;

    private BeaconOrganization organization;

    private String description;

    private String version;

    private String welcomeUrl;

    private String alternativeUrl;

    private String createDateTime;

    private String updateDateTime;

    private List<BeaconDataset> datasets;

    public BeaconImpl() {
        this.id = ID;
        this.name = NAME;
        this.apiVersion = APIVERSION;
        this.organization = new BeaconOrganizationImpl();
        this.description = DESCRIPTION;
        this.version = VERSION;
        this.welcomeUrl = WELCOME_URL;
        this.alternativeUrl = ALTERNATIVE_URL;
        this.createDateTime = CREATED_DATE_TIME;
        this.updateDateTime = UPDATE_DATE_TIME;
    }

    @Override
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    @Override
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @Override
    public String getApiVersion() {
        return apiVersion;
    }

    public void setApiVersion(String apiVersion) {
        this.apiVersion = apiVersion;
    }

    @Override
    public BeaconOrganization getOrganization() {
        return organization;
    }

    public void setOrganization(BeaconOrganization organization) {
        this.organization = organization;
    }

    @Override
    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    @Override
    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    @Override
    public String getWelcomeUrl() {
        return welcomeUrl;
    }

    public void setWelcomeUrl(String welcomeUrl) {
        this.welcomeUrl = welcomeUrl;
    }

    @Override
    public String getAlternativeUrl() {
        return alternativeUrl;
    }

    public void setAlternativeUrl(String alternativeUrl) {
        this.alternativeUrl = alternativeUrl;
    }

    @Override
    public String getCreateDateTime() {
        return createDateTime;
    }

    public void setCreateDateTime(String createDateTime) {
        this.createDateTime = createDateTime;
    }

    @Override
    public String getUpdateDateTime() {
        return updateDateTime;
    }

    public void setUpdateDateTime(String updateDateTime) {
        this.updateDateTime = updateDateTime;
    }

    @Override
    public List<BeaconDataset> getDatasets() {
        return datasets;
    }

    public void setDatasets(List<BeaconDataset> datasets) {
        this.datasets = datasets;
    }
}