package uk.ac.ebi.eva.server.configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@ConfigurationProperties(ignoreUnknownFields = true, prefix = "swagger.documentation")
@Configuration
public class SwaggerDocumentationConfiguration {

    private String species;

    public String getSpecies() {
        return species;
    }

    public void setSpecies(String species) {
        this.species = species;
    }
}
