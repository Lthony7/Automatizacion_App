/*
 * Prompt Provider - Content Automation Platform FASE 4
 * Interface for managing prompt templates with versioning, variables, and overrides
 * Core depends only on this interface, not on hardcoded prompts
*/

export interface PromptProvider {
  /**
   * Get a prompt template by name and version
   * @param templateName Name of the template (e.g., "morning_prayer_prompt")
   * @param version Version string (e.g., "1.0.0", "latest")
   * @returns The prompt template string, or null if not found
  */
  getPrompt(
    templateName: string,
    version?: string
  ): Promise<string | null>;

  /**
   * Get all available versions for a template
   */
  listVersions(templateName: string): Promise<string[]>;

  /**
   * Get prompt metadata (version, description, variables)
   */
  getPromptMetadata(templateName: string): Promise<{
    version: string;
    description: string;
    variables: string[];
    vertical?: string;
    contentType?: string;
    projectOverride?: boolean;
    tenantOverride?: boolean;
    systemPrompt?: string;
  }>;

  /**
   * Resolve a prompt with variable substitution
   * - System Prompt (base)
   * - Domain Prompt (vertical-specific)
   * - Project Prompt (project-specific overrides)
   * - Content Prompt (content-type-specific overrides)
   * @param templateName Base template name
   * @param variables Variable values for substitution
   * @param vertical Vertical context (e.g., "christian", "automotive")
   * @param projectId Project ID for project overrides
   * @param tenantId Tenant ID for tenant overrides
   * @param contentType Content type (e.g., "prayer", "verse")
   * @returns Resolved prompt with all substitutions applied
  */
  resolvePrompt(
    templateName: string,
    variables?: Record<string, string>,
    vertical?: string,
    projectId?: string,
    tenantId?: string,
    contentType?: string
  ): Promise<string>;

  /**
   * List all available prompt templates
   */
  listTemplates(): Promise<string[]>;

  /**
   * Save a new prompt version (admin operation)
   * @param templateName Base template name
   * @param version Version string
   * @prompt The prompt template text
   * @param variables List of variable names
   * @param description Description of the template
   * @param vertical Vertical this template belongs to
   * @param contentType Content type this template belongs to
   * @param isSystem Whether this is a system-level template
   * @param isDefault Whether this is the default version
  */
  savePromptVersion(
    templateName: string,
    version: string,
    prompt: string,
    variables: string[],
    description: string,
    vertical: string,
    contentType: string,
    isSystem: boolean,
    isDefault: boolean
  ): Promise<void>;
}