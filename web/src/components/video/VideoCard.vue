<template>
  <router-link :to="`/video/${video.videoId}`" class="video-card">
    <div class="card-cover">
      <img :src="coverUrl" :alt="video.videoName" loading="lazy" />
      <span class="duration">{{ formatDuration(video.duration) }}</span>
      <div class="cover-mask">
        <span class="play-count">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          {{ formatCount(video.playCount) }}
        </span>
        <span class="danmu-count">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          {{ formatCount(video.danmuCount) }}
        </span>
      </div>
    </div>
    <div class="card-info">
      <h3 class="video-title" :title="video.videoName">{{ video.videoName }}</h3>
      <div class="video-meta">
        <router-link
          v-if="video.userId"
          :to="`/user/${video.userId}`"
          class="uploader"
          @click.stop
        >
          <img v-if="video.userAvatar" :src="getResourceUrl(video.userAvatar)" class="avatar" />
          <span>{{ video.nickName || 'UP主' }}</span>
        </router-link>
        <span v-else class="uploader">{{ video.nickName || 'UP主' }}</span>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { formatCount, formatDuration, getResourceUrl, pickField } from '@/utils/format'

const props = defineProps({
  video: {
    type: Object,
    required: true
  }
})

const coverUrl = computed(() => {
  const cover = pickField(props.video, 'videoCover', 'video_cover')
  return getResourceUrl(cover) || 'https://i0.hdslb.com/bfs/archive/placeholder.jpg'
})
</script>

<style scoped lang="scss">
.video-card {
  display: block;
  border-radius: var(--bili-radius);
  overflow: hidden;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);

    .card-cover img {
      transform: scale(1.05);
    }
  }
}

.card-cover {
  position: relative;
  aspect-ratio: 16 / 9;
  border-radius: var(--bili-radius);
  overflow: hidden;
  background: #e3e5e7;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }
}

.duration {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 12px;
}

.cover-mask {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 12px;
  padding: 24px 8px 8px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  color: #fff;
  font-size: 12px;
}

.play-count,
.danmu-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-info {
  padding: 10px 4px 4px;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--bili-text);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 6px;
  transition: color 0.2s;

  .video-card:hover & {
    color: var(--bili-pink);
  }
}

.video-meta {
  font-size: 12px;
  color: var(--bili-text-tertiary);
}

.uploader {
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    color: var(--bili-pink);
  }

  .avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    object-fit: cover;
  }
}
</style>
