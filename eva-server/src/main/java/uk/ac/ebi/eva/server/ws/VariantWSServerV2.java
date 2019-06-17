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

package uk.ac.ebi.eva.server.ws;

import io.swagger.annotations.Api;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.hateoas.Link;
import org.springframework.hateoas.Resource;
import org.springframework.hateoas.TemplateVariables;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import uk.ac.ebi.eva.commons.core.models.Annotation;
import uk.ac.ebi.eva.commons.core.models.AnnotationMetadata;
import uk.ac.ebi.eva.commons.core.models.ws.VariantSourceEntryWithSampleNames;
import uk.ac.ebi.eva.commons.core.models.ws.VariantWithSamplesAndAnnotation;
import uk.ac.ebi.eva.commons.mongodb.filter.FilterBuilder;
import uk.ac.ebi.eva.commons.mongodb.filter.VariantRepositoryFilter;
import uk.ac.ebi.eva.commons.mongodb.services.AnnotationMetadataNotFoundException;
import uk.ac.ebi.eva.commons.mongodb.services.VariantWithSamplesAndAnnotationsService;
import uk.ac.ebi.eva.lib.eva_utils.DBAdaptorConnector;
import uk.ac.ebi.eva.lib.eva_utils.MultiMongoDbFactory;
import uk.ac.ebi.eva.lib.utils.QueryResponse;
import uk.ac.ebi.eva.lib.utils.QueryResult;
import uk.ac.ebi.eva.server.Utils;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.springframework.hateoas.mvc.ControllerLinkBuilder.linkTo;
import static org.springframework.hateoas.mvc.ControllerLinkBuilder.methodOn;

@RestController
@RequestMapping(value = "/v2/variants", produces = "application/json")
@Api(tags = {"variants"})
public class VariantWSServerV2 extends EvaWSServer {

    @Autowired
    private VariantWithSamplesAndAnnotationsService service;

    @GetMapping(value = "/{variantId}/info")
    public QueryResponse getCoreInfo(@PathVariable("variantId") String variantId,
                                     @RequestParam(name = "studies", required = false) List<String> studies,
                                     @RequestParam(name = "species") String species,
                                     @RequestParam(name = "annot-ct", required = false) List<String> consequenceType,
                                     @RequestParam(name = "maf", required = false) String maf,
                                     @RequestParam(name = "polyphen", required = false) String polyphenScore,
                                     @RequestParam(name = "sift", required = false) String siftScore,
                                     @RequestParam(name = "annot-vep-version", required = false)
                                             String annotationVepVersion,
                                     @RequestParam(name = "annot-vep-cache-version", required = false) String
                                             annotationVepCacheVersion,
                                     HttpServletResponse response)
            throws IOException {
        initializeQuery();

        String errorMessage = checkErrorHelper(annotationVepVersion, annotationVepCacheVersion, species);
        if (errorMessage != null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return setErrorQueryResponse(errorMessage);
        }

        MultiMongoDbFactory.setDatabaseNameForCurrentThread(DBAdaptorConnector.getDBName(species));

        List<VariantWithSamplesAndAnnotation> variantEntities;
        Long numTotalResults;

        try {
            if (variantId.contains(":")) {
                variantEntities = getVariantEntitiesByParams(variantId, annotationVepVersion,
                        annotationVepCacheVersion);
                numTotalResults = (long) variantEntities.size();
            } else {
                List<VariantRepositoryFilter> filters = new FilterBuilder()
                        .getVariantEntityRepositoryFilters(maf, polyphenScore, siftScore, studies, consequenceType);
                variantEntities = getVariantEntitiesByVariantId(annotationVepVersion, annotationVepCacheVersion,
                        variantId, filters);
                numTotalResults = service.countByIdsAndComplexFilters(Arrays.asList(variantId), filters);
            }
        } catch (AnnotationMetadataNotFoundException ex) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return setQueryResponse(ex.getMessage());
        }

        List<VariantWithSamplesAndAnnotation> rootVariantEntities = new ArrayList<>();
        variantEntities.forEach(variantEntity -> {

            VariantWithSamplesAndAnnotation temp = new VariantWithSamplesAndAnnotation(variantEntity.getChromosome(),
                    variantEntity.getStart(), variantEntity.getEnd(), variantEntity.getReference(),
                    variantEntity.getReference(), variantEntity.getMainId());

            variantEntity.getIds().forEach(id -> temp.addId(id));
            rootVariantEntities.add(temp);
        });

        QueryResult<VariantWithSamplesAndAnnotation> queryResult = buildQueryResult(rootVariantEntities,
                numTotalResults);

        return setQueryResponse(queryResult);
    }

    private String checkErrorHelper(String annotationVepVersion, String annotationVepCacheVersion, String species) {
        if (annotationVepVersion == null ^ annotationVepCacheVersion == null) {
            return "Please specify either both annotation VEP version and annotation VEP cache version, or neither";
        }

        if (species.isEmpty()) {
            return "Please specify a species";
        }

        return null;
    }

    private List<VariantWithSamplesAndAnnotation> getVariantEntitiesByParams(String variantId,
                                                                             String annotationVepVersion,
                                                                             String annotationVepCacheVersion) throws
            AnnotationMetadataNotFoundException {
        String[] regionId = variantId.split(":");
        String alternate = (regionId.length > 3) ? regionId[3] : null;

        AnnotationMetadata annotationMetadata = null;
        if (annotationVepVersion != null && annotationVepCacheVersion != null) {
            annotationMetadata = new AnnotationMetadata(annotationVepVersion, annotationVepCacheVersion);
        }

        if (alternate != null) {
            return service.findByChromosomeAndStartAndReferenceAndAlternate(regionId[0], Integer.parseInt(regionId[1]),
                    regionId[2], alternate, annotationMetadata);
        } else {
            return service.findByChromosomeAndStartAndReference(regionId[0], Integer.parseInt(regionId[1]),
                    regionId[2], annotationMetadata);
        }
    }

    private List<VariantWithSamplesAndAnnotation> getVariantEntitiesByVariantId(String annotationVepVersion,
                                                                                String annotationVepCacheVersion,
                                                                                String variantId,
                                                                                List<VariantRepositoryFilter> filters)
            throws AnnotationMetadataNotFoundException {
        AnnotationMetadata annotationMetadata = null;
        if (annotationVepVersion != null && annotationVepCacheVersion != null) {
            annotationMetadata = new AnnotationMetadata(annotationVepVersion, annotationVepCacheVersion);
        }

        return service.findByIdsAndComplexFilters(Arrays.asList(variantId), filters, annotationMetadata, null,
                Utils.getPageRequest(getQueryOptions()));
    }

    @GetMapping(value = "/{variantId}/info/annotations")
    public QueryResponse getAnnotations(@PathVariable("variantId") String variantId,
                                        @RequestParam(name = "studies", required = false) List<String> studies,
                                        @RequestParam(name = "species") String species,
                                        @RequestParam(name = "annot-ct", required = false) List<String> consequenceType,
                                        @RequestParam(name = "maf", required = false) String maf,
                                        @RequestParam(name = "polyphen", required = false) String polyphenScore,
                                        @RequestParam(name = "sift", required = false) String siftScore,
                                        @RequestParam(name = "annot-vep-version", required = false)
                                                String annotationVepVersion,
                                        @RequestParam(name = "annot-vep-cache-version", required = false)
                                                String annotationVepCacheVersion,
                                        HttpServletResponse response)
            throws IOException {
        initializeQuery();

        String errorMessage = checkErrorHelper(annotationVepVersion, annotationVepCacheVersion, species);
        if (errorMessage != null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return setErrorQueryResponse(errorMessage);
        }

        MultiMongoDbFactory.setDatabaseNameForCurrentThread(DBAdaptorConnector.getDBName(species));

        List<VariantWithSamplesAndAnnotation> variantEntities;
        try {
            if (variantId.contains(":")) {
                variantEntities = getVariantEntitiesByParams(variantId, annotationVepVersion,
                        annotationVepCacheVersion);
            } else {
                List<VariantRepositoryFilter> filters = new FilterBuilder()
                        .getVariantEntityRepositoryFilters(maf, polyphenScore, siftScore, studies, consequenceType);
                variantEntities = getVariantEntitiesByVariantId(annotationVepVersion, annotationVepCacheVersion,
                        variantId, filters);
            }
        } catch (AnnotationMetadataNotFoundException ex) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return setQueryResponse(ex.getMessage());
        }

        List<Annotation> annotations = new ArrayList<>();
        variantEntities.forEach(variantEntity -> {
            annotations.add(variantEntity.getAnnotation());
        });

        QueryResult<Annotation> queryResult = buildQueryResult(annotations, annotations.size());

        return setQueryResponse(queryResult);
    }

    @GetMapping(value = "/{variantId}/info/source-Entries")
    public QueryResponse getSourceEntries(@PathVariable("variantId") String variantId,
                                          @RequestParam(name = "studies", required = false) List<String> studies,
                                          @RequestParam(name = "species") String species,
                                          @RequestParam(name = "annot-ct", required = false)
                                                  List<String> consequenceType,
                                          @RequestParam(name = "maf", required = false) String maf,
                                          @RequestParam(name = "polyphen", required = false) String polyphenScore,
                                          @RequestParam(name = "sift", required = false) String siftScore,
                                          @RequestParam(name = "annot-vep-version", required = false)
                                                  String annotationVepVersion,
                                          @RequestParam(name = "annot-vep-cache-version", required = false)
                                                  String annotationVepCacheVersion,
                                          HttpServletResponse response)
            throws IOException {
        initializeQuery();

        String errorMessage = checkErrorHelper(annotationVepVersion, annotationVepCacheVersion, species);
        if (errorMessage != null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return setErrorQueryResponse(errorMessage);
        }

        MultiMongoDbFactory.setDatabaseNameForCurrentThread(DBAdaptorConnector.getDBName(species));

        List<VariantWithSamplesAndAnnotation> variantEntities;
        try {
            if (variantId.contains(":")) {
                variantEntities = getVariantEntitiesByParams(variantId, annotationVepVersion,
                        annotationVepCacheVersion);
            } else {
                List<VariantRepositoryFilter> filters = new FilterBuilder()
                        .getVariantEntityRepositoryFilters(maf, polyphenScore, siftScore, studies, consequenceType);
                variantEntities = getVariantEntitiesByVariantId(annotationVepVersion, annotationVepCacheVersion,
                        variantId, filters);
            }
        } catch (AnnotationMetadataNotFoundException ex) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return setQueryResponse(ex.getMessage());
        }

        List<VariantSourceEntryWithSampleNames> variantSources = new ArrayList<>();
        variantEntities.forEach(variantEntity -> {
            variantEntity.getSourceEntries().forEach(sourceEntry -> {
                variantSources.add(sourceEntry);
            });
        });

        QueryResult<VariantSourceEntryWithSampleNames> queryResult = buildQueryResult(variantSources,
                variantSources.size());

        return setQueryResponse(queryResult);
    }

    @GetMapping(value = "/{variantId}/info/source-Entries/{sourceEntryId}")
    public QueryResponse getSourceEntry(@PathVariable("variantId") String variantId,
                                        @PathVariable("sourceEntryId") String sourceEntryId,
                                        @RequestParam(name = "studies", required = false) List<String> studies,
                                        @RequestParam(name = "species") String species,
                                        @RequestParam(name = "annot-ct", required = false)
                                                List<String> consequenceType,
                                        @RequestParam(name = "maf", required = false) String maf,
                                        @RequestParam(name = "polyphen", required = false) String polyphenScore,
                                        @RequestParam(name = "sift", required = false) String siftScore,
                                        @RequestParam(name = "annot-vep-version", required = false)
                                                String annotationVepVersion,
                                        @RequestParam(name = "annot-vep-cache-version", required = false)
                                                String annotationVepCacheVersion,
                                        HttpServletResponse response)
            throws IOException {
        initializeQuery();

        String errorMessage = checkErrorHelper(annotationVepVersion, annotationVepCacheVersion, species);
        if (errorMessage != null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return setErrorQueryResponse(errorMessage);
        }

        String fileId;
        String studyId;
        if (sourceEntryId.contains("_")) {
            String[] split = sourceEntryId.split("_");
            studyId = split[0];
            fileId = split[1];
        } else {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return setErrorQueryResponse("{sourceEntryId} should contain '_'");
        }

        MultiMongoDbFactory.setDatabaseNameForCurrentThread(DBAdaptorConnector.getDBName(species));

        List<VariantWithSamplesAndAnnotation> variantEntities;
        try {
            if (variantId.contains(":")) {
                variantEntities = getVariantEntitiesByParams(variantId, annotationVepVersion,
                        annotationVepCacheVersion);
            } else {
                List<VariantRepositoryFilter> filters = new FilterBuilder()
                        .getVariantEntityRepositoryFilters(maf, polyphenScore, siftScore, studies, consequenceType);
                variantEntities = getVariantEntitiesByVariantId(annotationVepVersion,
                        annotationVepCacheVersion, variantId, filters);
            }
        } catch (AnnotationMetadataNotFoundException ex) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return setQueryResponse(ex.getMessage());
        }

        List<VariantSourceEntryWithSampleNames> variantSources = new ArrayList<>();
        variantEntities.forEach(variantEntity -> {
            variantSources.add(variantEntity.getSourceEntry(fileId, studyId));
        });

        QueryResult<VariantSourceEntryWithSampleNames> queryResult = buildQueryResult(variantSources,
                variantSources.size());

        return setQueryResponse(queryResult);
    }

    @GetMapping(value = "/{variantId}/info/links")
    public Resource<QueryResponse> getLinks(@PathVariable("variantId") String variantId,
                                            @RequestParam(name = "studies", required = false) List<String> studies,
                                            @RequestParam(name = "species") String species,
                                            @RequestParam(name = "annot-ct", required = false)
                                                    List<String> consequenceType,
                                            @RequestParam(name = "maf", required = false) String maf,
                                            @RequestParam(name = "polyphen", required = false) String polyphenScore,
                                            @RequestParam(name = "sift", required = false) String siftScore,
                                            @RequestParam(name = "annot-vep-version", required = false)
                                                    String annotationVepVersion,
                                            @RequestParam(name = "annot-vep-cache-version", required = false) String
                                                    annotationVepCacheVersion,
                                            HttpServletResponse response) throws IOException {

        QueryResponse queryResponse = getCoreInfo(variantId, studies, species, consequenceType, maf, polyphenScore,
                siftScore, annotationVepVersion, annotationVepCacheVersion, response);

        Link coreLink = new Link(linkTo(methodOn(VariantWSServerV2.class).getCoreInfo(variantId, studies,
                species, consequenceType, maf, polyphenScore, siftScore, annotationVepVersion,
                annotationVepCacheVersion, response)).toUri().toString(), "coreinfo");

        Link annotationLink = new Link(linkTo(methodOn(VariantWSServerV2.class).getAnnotations(variantId, studies,
                species, consequenceType, maf, polyphenScore, siftScore, annotationVepVersion,
                annotationVepCacheVersion, response)).toUri().toString(), "annotations");

        return new Resource<>(queryResponse, coreLink, annotationLink);
    }
}
