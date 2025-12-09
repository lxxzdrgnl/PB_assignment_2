<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="footer-container">
      <div class="footer-content">
        <div class="footer-brand">
          <i class="fas fa-film"></i>
          <span class="brand-name">MovieFlix</span>
        </div>

        <div class="footer-links">
          <a
            href="https://github.com/lxxzdrgnl/PB_assignment_2"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link"
            title="GitHub"
          >
            <i class="fab fa-github"></i>
          </a>
          <a
            href="https://www.instagram.com/lxxzdrgnl/"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link"
            title="Instagram"
          >
            <i class="fab fa-instagram"></i>
          </a>
        </div>

        <div class="footer-info">
          <p class="footer-text">
            © {{ currentYear }} MovieFlix. All rights reserved.
          </p>
          <p class="footer-attribution">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: var(--bg-light);
  border-top: 1px solid var(--border-color);
  margin-top: 2rem;
  padding: 1rem 0;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.footer-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: var(--text-primary);
}

.footer-brand i {
  color: var(--primary-color);
  font-size: 1.3rem;
}

.brand-name {
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-color), #b20710);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.footer-links {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.footer-link {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  font-size: 1.3rem;
  transition: all 0.3s ease;
  text-decoration: none;
}

.footer-link:hover {
  color: var(--primary-color);
  transform: scale(1.15);
}

.footer-info {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.footer-text {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin: 0;
}

.footer-attribution {
  color: var(--text-muted);
  font-size: 0.75rem;
  margin: 0;
}

@media (max-width: 768px) {
  .app-footer {
    margin-top: 1.5rem;
    padding: 1rem 0;
  }

  .footer-content {
    flex-direction: column;
    gap: 0.75rem;
  }

  .footer-brand {
    font-size: 0.95rem;
  }

  .footer-brand i {
    font-size: 1.2rem;
  }

  .footer-link {
    font-size: 1.2rem;
  }

  .footer-text,
  .footer-attribution {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .footer-brand {
    font-size: 0.9rem;
  }

  .footer-brand i {
    font-size: 1.1rem;
  }

  .footer-link {
    font-size: 1.1rem;
  }

  .footer-links {
    gap: 0.75rem;
  }
}
</style>
