# Video Pipeline

## Overview

Video Engine receives content, template, media, audio, subtitles and produces rendered MP4 video. Completely independent of vertical/domain.

## Input Contract

The Video Engine receives an object with:

```typescript
interface VideoRenderInput {
  content: ContentEntity;       // Content being rendered
  template: TemplateEntity;     // Video template configuration
  media: MediaEntity;           // Video clips, images, backgrounds
  audio: AudioEntity;           // Generated or selected audio
  subtitles: SubtitleEntity;    // Subtitle tracks
}
```

### Content Requirements
- Must be in APPROVED state (or VALIDATED for rendering)
- Has associated audio track
- Has subtitle data if applicable
- vertical/domain metadata for reference only (not used for rendering logic)

### Template Requirements
- Template defines layout, positioning, styles
- Template specifies duration per section
- Template defines transition effects
- Template has thumbnail configuration
- Template may have placeholders filled with content data

### Media Requirements
- Background video/images ready
- Resolution: 1080x1920 (vertical format)
- Frame rate: 30fps
- Codec: H264
- Audio: AAC
- Format: MP4
- Aspect ratio: 9:16 vertical video

### Audio Requirements
- Generated via TTS or imported
- Format: AAC
- Duration matches content
- Quality: medium or high
- No copyrighted material without license

### Subtitle Requirements
- Language configuration
- Text content
- Timing synchronization with audio
- SRT or VTT format

## Output Contract

### Video Output
```typescript
interface VideoRenderOutput {
  videoUrl: string;             // S3 object URL
  duration: number;            // seconds
  width: number;               // 1080
  height: number;              // 1920
  fps: number;                 // 30
  codec: string;              // H264
  audioCodec: string;         // AAC
  format: string;             // MP4
  fileSize: number;           // bytes
  subtitles: SubtitleInfo[];   // embedded or separate
  metadata: VideoMetadata;     // creation time, etc.
}
```

### Technical Specifications
- Resolution: 1080x1920 pixels
- Frame rate: 30fps
- Video codec: H264 (libx264 in FFmpeg)
- Audio codec: AAC (aac in FFmpeg)
- Container: MP4 / MOV
- Aspect ratio: 9:16 vertical
- Bitrate: configurable (e.g., 5Mbps video, 128kbps audio)

## FFmpeg Integration

### FFmpeg Command Structure

```bash
ffmpeg -i [background_video] -i [audio_track] \
       -i [subtitle_file] \
       -filter_complex "
[0:v]scale=1080:1920,setsar=1:1[video];
[1:a]atrim=0:[audio];[audio]volume=1.0[main_audio];
[video][main_audio]overlay=shortest=1[output]
" -c:v libx264 -preset medium -c:a aac -b:a 128k -pix_fmt yuv420p -t duration [output].mp4
```

### FFmpeg Filters Used
- `scale`: resize to 1080x1920
- `setsar`: set sample aspect ratio
- `trim`: adjust duration
- `overlay`: compose video + audio
- `tpad`: pad if needed for smooth transitions
- `subtitles`: burn in or add subtitle track

### Idempotency
- Same input produces same output (deterministic FFmpeg args)
- Output URL includes content_id and hash for caching
- Intermediate files cleaned up after successful publish

## Rendering Workflow

### State Machine Integration

```
DRAFT -> QUEUED -> GENERATING -> GENERATED -> VALIDATING -> VALIDATED ->
AUDIO_GENERATING -> AUDIO_GENERATED -> RENDERING -> RENDERED ->
AI_REVIEW -> PENDING_APPROVAL -> EDITING -> REJECTED/APPROVED
```

### Rendering Triggers
1. Content state transitions to VALIDATED
2. Audio state is AUDIO_GENERATED
3. Manual trigger from admin panel
4. Scheduled rendering job

### Rendering Queue
- BullMQ queue: "video-render"
- Priority based on: plan, content urgency
- Job data: render input, tenant_id, project_id
- Progress tracking: 0-100% via job progress
- Timeout: 30min max per video (configurable)

### Error Handling
- FFmpeg errors captured and logged
- Automatic retry (max 3 attempts)
- Failed videos state: RENDERING -> FAILED
- Manual intervention required for persistent failures
- Error types: resolution, audio sync, encoding, timeout

## Subtitle Integration

### Subtitle Options
1. **Burned-in**: Subtitles embedded in video frame
2. **Separate SRT/VTT**: Subtitle file alongside video
3. **Both**: Burned-in + separate file

### FFmpeg Subtitle Filter
```bash
ffmpeg -i video.mp4 -vf "subtitles=subtitles.es.srt" output_with_subtitles.mp4
```

### Subtitle Styles
- Font size, color, background
- Position: bottom, top, center
- Background opacity for readability
- Timing synchronization with audio

## Template System

### Template Types
- **Prayer template**: Title, prayer text, verse, background image
- **Verse template**: Scripture reference, text, decorative elements
- **Story template**: Character images, scene setting, narrative flow
- **Custom template**: Per-project configuration

### Template Metadata
- Layout configuration (9:16 grid positions)
- Font choices and sizes
- Color schemes per vertical
- Animation transitions
- Branding elements (logo, watermark)
- Placeholder positions for content data

### Template Per Vertical
- Christian: religious imagery, appropriate colors
- Automotive: technical graphics, relevant colors
- Templates stored per tenant/project

## Video Publishing

### Post-Rendering Steps
1. Video state: RENDERED -> AI_REVIEW (if AI quality check)
2. AI_REVIEW -> PENDING_APPROVAL (if human review required)
3. PENDING_APPROVAL -> APPROVED (human approval)
4. APPROVED -> SCHEDULED (state machine rule)
5. SCHEDULED -> PUBLISHING (state machine rule)
6. PUBLISHING -> PUBLISHED (publication attempt)

### Publisher Integration
- YouTubePublisher: uploads as Shorts (vertical video)
- InstagramPublisher: publishes to Feed or Stories
- FacebookPublisher: publishes to Page or Profile
- Each publisher receives: video_url, title, description, tags, CTA

### Publication Queue
- BullMQ queue: "publication"
- Content must be APPROVED before publication
- Publisher abstraction handles platform-specific API calls
- Publication result stored in publisher_attempts table