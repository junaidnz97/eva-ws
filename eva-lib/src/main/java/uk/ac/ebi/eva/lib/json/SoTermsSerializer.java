/*
 * Copyright 2016-2017 EMBL - European Bioinformatics Institute
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package uk.ac.ebi.eva.lib.json;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;

import uk.ac.ebi.eva.lib.utils.ConsequenceTypeMappings;

import java.io.IOException;
import java.util.Set;

public class SoTermsSerializer extends StdSerializer<Set<Integer>> {

    protected SoTermsSerializer() {
        super(Set.class, true);
    }

    @Override
    public void serialize(Set<Integer> integers, JsonGenerator jsonGenerator,
                          SerializerProvider serializerProvider) throws IOException, JsonProcessingException {
        jsonGenerator.writeStartArray();
        for (Integer soAccession : integers) {
            jsonGenerator.writeStartObject();
            String soName = ConsequenceTypeMappings.accessionToTerm.get(soAccession);
            jsonGenerator.writeStringField("soName", soName);
            jsonGenerator.writeStringField("soAccession", ConsequenceTypeMappings.getSoAccessionString(soName));
            jsonGenerator.writeEndObject();
        }
        jsonGenerator.writeEndArray();
    }
}
