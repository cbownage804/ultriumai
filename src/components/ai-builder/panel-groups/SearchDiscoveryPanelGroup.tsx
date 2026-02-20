// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { useFullTextSearchSetup } from '@/hooks/useFullTextSearchSetup';
import { useFacetedFilterBuilder } from '@/hooks/useFacetedFilterBuilder';
import { useAutocompleteGenerator } from '@/hooks/useAutocompleteGenerator';
import { useTagCategorySystem } from '@/hooks/useTagCategorySystem';
import { useSEOMetaGenerator } from '@/hooks/useSEOMetaGenerator';
import { FullTextSearchPanel, FacetedFilterPanel, AutocompletePanel, TagSystemPanel, SEOMetaPanel } from '../lazyPanels';
import type { PanelGroupSharedProps } from './types';
import { makeInsertCode } from './types';

interface Props extends PanelGroupSharedProps {
  showFTS: boolean; setShowFTS: (v: boolean) => void;
  showFacetedFilter: boolean; setShowFacetedFilter: (v: boolean) => void;
  showAutocomplete: boolean; setShowAutocomplete: (v: boolean) => void;
  showTagSystem: boolean; setShowTagSystem: (v: boolean) => void;
  showSEOMeta: boolean; setShowSEOMeta: (v: boolean) => void;
}

export function SearchDiscoveryPanelGroup(props: Props) {
  const ftsSetup = useFullTextSearchSetup();
  const facetedFilter = useFacetedFilterBuilder();
  const autocompleteGen = useAutocompleteGenerator();
  const tagSystem = useTagCategorySystem();
  const seoMetaGen = useSEOMetaGenerator();
  const insertCode = makeInsertCode(props.activeFile, props.upsertFile);

  return (
    <>
      <SafePanel show={props.showFTS} name="Full Text Search">
        <FullTextSearchPanel open={props.showFTS} onClose={() => props.setShowFTS(false)} config={ftsSetup.config} onUpdateConfig={ftsSetup.updateConfig} onGenerateCode={ftsSetup.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showFacetedFilter} name="Faceted Filter">
        <FacetedFilterPanel open={props.showFacetedFilter} onClose={() => props.setShowFacetedFilter(false)} filters={facetedFilter.filters} onAdd={facetedFilter.addFilter} onRemove={facetedFilter.removeFilter} onGenerateCode={facetedFilter.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showAutocomplete} name="Autocomplete">
        <AutocompletePanel open={props.showAutocomplete} onClose={() => props.setShowAutocomplete(false)} config={autocompleteGen.config} onUpdateConfig={autocompleteGen.updateConfig} onGenerateCode={autocompleteGen.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showTagSystem} name="Tag System">
        <TagSystemPanel open={props.showTagSystem} onClose={() => props.setShowTagSystem(false)} tags={tagSystem.tags} categories={tagSystem.categories} onAddTag={tagSystem.addTag} onRemoveTag={tagSystem.removeTag} onAddCategory={tagSystem.addCategory} onGenerateCode={tagSystem.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showSEOMeta} name="SEO Meta">
        <SEOMetaPanel open={props.showSEOMeta} onClose={() => props.setShowSEOMeta(false)} config={seoMetaGen.config} onUpdateConfig={seoMetaGen.updateConfig} onGenerateCode={() => seoMetaGen.generateCode(props.project.files)} onInsertCode={insertCode} />
      </SafePanel>
    </>
  );
}
