<template>
  <div class="video-player" ref="playerRef">
    <video
      ref="videoRef"
      class="video-element"
      :poster="poster"
      controls
      @timeupdate="onTimeUpdate"
      @play="onPlay"
      @pause="onPause"
    />
    <div v-if="danmuEnabled" class="danmu-layer" ref="danmuLayerRef">
      <div
        v-for="item in visibleDanmu"
        :key="item.id"
        class="danmu-item"
        :style="item.style"
      >
        {{ item.text }}
      </div>
    </div>
    <div v-if="showDanmuInput" class="danmu-input-bar">
      <input
        v-model="danmuText"
        type="text"
        placeholder="发个友善的弹幕见证当下"
        maxlength="100"
        @keyup.enter="sendDanmu"
      />
      <button class="btn-primary" @click="sendDanmu">发送</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import Hls from 'hls.js'

const props = defineProps({
  src: String,
  poster: String,
  danmuList: { type: Array, default: () => [] },
  danmuEnabled: { type: Boolean, default: true },
  showDanmuInput: { type: Boolean, default: false }
})

const emit = defineEmits(['timeupdate', 'send-danmu'])

const videoRef = ref(null)
const danmuLayerRef = ref(null)
const danmuText = ref('')
const currentTime = ref(0)
const activeDanmu = ref([])
let hls = null
let danmuId = 0

const visibleDanmu = computed(() => activeDanmu.value)

function initPlayer() {
  if (!props.src || !videoRef.value) return
  destroyPlayer()

  if (props.src.includes('.m3u8') || props.src.includes('videoResource')) {
    if (Hls.isSupported()) {
      hls = new Hls()
      hls.loadSource(props.src)
      hls.attachMedia(videoRef.value)
    } else if (videoRef.value.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.value.src = props.src
    }
  } else {
    videoRef.value.src = props.src
  }
}

function destroyPlayer() {
  if (hls) {
    hls.destroy()
    hls = null
  }
}

function onTimeUpdate() {
  if (!videoRef.value) return
  currentTime.value = videoRef.value.currentTime
  emit('timeupdate', currentTime.value)
  showDanmuAtTime(currentTime.value)
}

function onPlay() {}
function onPause() {}

function showDanmuAtTime(time) {
  const tolerance = 0.5
  props.danmuList.forEach((d) => {
    const t = Number(d.time)
    if (Math.abs(t - time) < tolerance) {
      const exists = activeDanmu.value.some((a) => a.rawId === d.danmuId)
      if (!exists) addDanmuToScreen(d)
    }
  })
}

function addDanmuToScreen(d) {
  const id = ++danmuId
  const top = Math.random() * 70 + 5
  const color = d.color ? `#${Number(d.color).toString(16).padStart(6, '0')}` : '#fff'
  const item = {
    id,
    rawId: d.danmuId,
    text: d.text,
    style: {
      top: `${top}%`,
      color,
      animationDuration: `${8 + Math.random() * 4}s`
    }
  }
  activeDanmu.value.push(item)
  setTimeout(() => {
    activeDanmu.value = activeDanmu.value.filter((a) => a.id !== id)
  }, 12000)
}

function sendDanmu() {
  if (!danmuText.value.trim()) return
  emit('send-danmu', {
    text: danmuText.value.trim(),
    time: currentTime.value
  })
  danmuText.value = ''
}

watch(() => props.src, initPlayer)

onMounted(initPlayer)
onUnmounted(destroyPlayer)

defineExpose({ videoRef, currentTime })
</script>

<style scoped lang="scss">
.video-player {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: var(--bili-radius);
  overflow: hidden;
}

.video-element {
  width: 100%;
  height: 100%;
  display: block;
}

.danmu-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.danmu-item {
  position: absolute;
  right: 0;
  white-space: nowrap;
  font-size: 20px;
  font-weight: 500;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  animation: danmu-scroll linear forwards;
}

@keyframes danmu-scroll {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(calc(-100vw - 100%));
  }
}

.danmu-input-bar {
  position: absolute;
  bottom: 48px;
  left: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  pointer-events: auto;

  input {
    flex: 1;
    height: 36px;
    padding: 0 12px;
    border: none;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    font-size: 14px;

    &::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }
  }

  .btn-primary {
    height: 36px;
    padding: 0 16px;
    font-size: 13px;
  }
}
</style>
