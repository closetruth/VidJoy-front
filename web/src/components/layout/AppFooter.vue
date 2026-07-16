<template>
  <footer class="app-footer">
    <div class="container footer-inner">
      <div class="footer-links">
        <a href="#">关于我们</a>
        <a href="#">联系我们</a>
        <a href="#">用户协议</a>
        <a href="#">隐私政策</a>
      </div>
      <p class="copyright">© 2026 VidJoy</p>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.app-footer {
  margin-top: 40px;
  padding: 24px 0;
  background: #fff;
  border-top: 1px solid var(--bili-border);
}

.footer-inner {
  text-align: center;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 12px;

  a {
    font-size: 13px;
    color: var(--bili-text-tertiary);

    &:hover {
      color: var(--bili-pink);
    }
  }
}

.copyright {
  font-size: 12px;
  color: var(--bili-text-tertiary);
}
</style>
