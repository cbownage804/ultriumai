// @ts-nocheck
import { SafePanel } from '../SafePanel';
import { useRichTextConfig } from '@/hooks/useRichTextConfig';
import { useFilePreviewGenerator } from '@/hooks/useFilePreviewGenerator';
import { useAvatarGenerator } from '@/hooks/useAvatarGenerator';
import { useCarouselBuilder } from '@/hooks/useCarouselBuilder';
import { useGalleryLightboxGenerator } from '@/hooks/useGalleryLightboxGenerator';
import { RichTextConfigPanel, FilePreviewGenPanel, AvatarGenPanel, CarouselBuilderPanel, GalleryLightboxPanel } from '../lazyPanels';
import type { PanelGroupSharedProps } from './types';
import { makeInsertCode } from './types';

interface Props extends PanelGroupSharedProps {
  showRichTextConfig: boolean; setShowRichTextConfig: (v: boolean) => void;
  showFilePreviewGen: boolean; setShowFilePreviewGen: (v: boolean) => void;
  showAvatarGen: boolean; setShowAvatarGen: (v: boolean) => void;
  showCarouselBuilder: boolean; setShowCarouselBuilder: (v: boolean) => void;
  showGalleryLightbox: boolean; setShowGalleryLightbox: (v: boolean) => void;
}

export function ContentMediaPanelGroup(props: Props) {
  const richTextConfig = useRichTextConfig();
  const filePreviewGen = useFilePreviewGenerator();
  const avatarGen = useAvatarGenerator();
  const carouselBuilder = useCarouselBuilder();
  const galleryLightbox = useGalleryLightboxGenerator();
  const insertCode = makeInsertCode(props.activeFile, props.upsertFile);

  return (
    <>
      <SafePanel show={props.showRichTextConfig} name="Rich Text Config">
        <RichTextConfigPanel open={props.showRichTextConfig} onClose={() => props.setShowRichTextConfig(false)} config={richTextConfig.config} onUpdateConfig={richTextConfig.updateConfig} extensions={richTextConfig.extensions} onToggleExtension={richTextConfig.toggleExtension} onGenerateCode={richTextConfig.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showFilePreviewGen} name="File Preview">
        <FilePreviewGenPanel open={props.showFilePreviewGen} onClose={() => props.setShowFilePreviewGen(false)} config={filePreviewGen.config} onUpdateConfig={filePreviewGen.updateConfig} onGenerateCode={filePreviewGen.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showAvatarGen} name="Avatar Generator">
        <AvatarGenPanel open={props.showAvatarGen} onClose={() => props.setShowAvatarGen(false)} config={avatarGen.config} onUpdateConfig={avatarGen.updateConfig} onGenerateCode={avatarGen.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showCarouselBuilder} name="Carousel Builder">
        <CarouselBuilderPanel open={props.showCarouselBuilder} onClose={() => props.setShowCarouselBuilder(false)} slides={carouselBuilder.slides} config={carouselBuilder.config} onAddSlide={carouselBuilder.addSlide} onRemoveSlide={carouselBuilder.removeSlide} onUpdateConfig={carouselBuilder.updateConfig} onGenerateCode={carouselBuilder.generateCode} onInsertCode={insertCode} />
      </SafePanel>
      <SafePanel show={props.showGalleryLightbox} name="Gallery Lightbox">
        <GalleryLightboxPanel open={props.showGalleryLightbox} onClose={() => props.setShowGalleryLightbox(false)} config={galleryLightbox.config} onUpdateConfig={galleryLightbox.updateConfig} onGenerateCode={galleryLightbox.generateCode} onInsertCode={insertCode} />
      </SafePanel>
    </>
  );
}
