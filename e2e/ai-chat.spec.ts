import { test, expect } from './fixtures/auth-fixture';

test.describe('Feature: AI Business Partner Assistant', () => {
  test.beforeEach(async ({ authedPage: page }) => {
    // Navigate to dashboard where dashboard layout is rendered
    await page.goto('/dashboard');
  });

  test('UI Element: Floating action button is visible on dashboard', async ({ authedPage: page }) => {
    const floatingBtn = page.locator('button[data-testid="ai-chat-floating-btn"]');
    await expect(floatingBtn).toBeVisible();
    await expect(floatingBtn).toContainText('Tanya Asisten AI');
  });

  test('UI Interaction: Clicking floating button opens the AI Chat drawer sheet', async ({ authedPage: page }) => {
    // Mock conversations and active conversation endpoints to avoid empty/failed API calls
    await page.route('**/store/ai/conversations/active*', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'No active conversation found' }),
      });
    });

    await page.route('**/store/ai/conversations?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: [], total: 0, page: 1, limit: 30, total_pages: 0 },
        }),
      });
    });

    const floatingBtn = page.locator('button[data-testid="ai-chat-floating-btn"]');
    await floatingBtn.click();

    // Drawer should open and floating button should disappear
    const drawer = page.locator('[data-testid="ai-chat-drawer"]');
    await expect(drawer).toBeVisible();
    await expect(floatingBtn).not.toBeVisible();

    // Verify drawer header and welcome text
    await expect(drawer.locator('text=Percakapan Baru')).toBeVisible();
    await expect(drawer.locator('text=Halo! Ada yang bisa saya bantu?')).toBeVisible();

    // Verify starter prompt chips are displayed
    await expect(drawer.locator('text=Bahan baku apa saja yang stoknya mau habis?')).toBeVisible();
    await expect(drawer.locator('text=Menu mana yang margin keuntungannya paling rendah?')).toBeVisible();

    // Close the drawer
    await page.locator('button:has(svg.lucide-x)').click();
    await expect(drawer).not.toBeVisible();
    await expect(floatingBtn).toBeVisible();
  });

  test('Happy Path: User sends a chat message and receives AI response', async ({ authedPage: page }) => {
    // Intercept active conversation check
    await page.route('**/store/ai/conversations/active*', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'No active conversation' }),
      });
    });

    await page.route('**/store/ai/conversations?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: [], total: 0, page: 1, limit: 30, total_pages: 0 },
        }),
      });
    });

    // Intercept creating new conversation / sending message
    await page.route('**/store/ai/conversations', async (route) => {
      if (route.request().method() === 'POST') {
        const payload = JSON.parse(route.request().postData() || '{}');
        expect(payload.message).toBeTruthy();

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Success',
            data: {
              conversation_id: 'conv-mock-123',
              message_id: 'msg-mock-456',
              role: 'assistant',
              content: 'Berdasarkan data stok saat ini, **Tepung Terigu** tersisa 2.5 kg dan mendekati batas minimum.',
              created_at: new Date().toISOString(),
            },
          }),
        });
      } else {
        await route.fallback();
      }
    });

    // Open drawer
    await page.click('button[data-testid="ai-chat-floating-btn"]');
    await expect(page.locator('[data-testid="ai-chat-drawer"]')).toBeVisible();

    // Type a question in input box
    const chatInput = page.locator('textarea[data-testid="ai-chat-input"]');
    await chatInput.fill('Berapa sisa stok bahan baku utama?');
    await page.click('button[data-testid="ai-chat-send-btn"]');

    // User message bubble should appear immediately (optimistic UI)
    const userMsg = page.locator('[data-testid="ai-message-user"]');
    await expect(userMsg).toBeVisible();
    await expect(userMsg).toContainText('Berapa sisa stok bahan baku utama?');

    // AI Assistant response bubble should appear after mock response fulfills
    const assistantMsg = page.locator('[data-testid="ai-message-assistant"]');
    await expect(assistantMsg).toBeVisible();
    await expect(assistantMsg).toContainText('Berdasarkan data stok saat ini');
    await expect(assistantMsg.locator('strong')).toContainText('Tepung Terigu');
  });

  test('UI Interaction: Clicking a starter prompt chip sends prompt automatically', async ({ authedPage: page }) => {
    await page.route('**/store/ai/conversations/active*', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'No active conversation' }),
      });
    });

    await page.route('**/store/ai/conversations?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: [], total: 0, page: 1, limit: 30, total_pages: 0 },
        }),
      });
    });

    await page.route('**/store/ai/conversations', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              conversation_id: 'conv-starter-123',
              message_id: 'msg-starter-456',
              role: 'assistant',
              content: 'Menu dengan margin terendah adalah **Roti Cokelat Spesial** dengan margin 18%.',
              created_at: new Date().toISOString(),
            },
          }),
        });
      } else {
        await route.fallback();
      }
    });

    // Open drawer
    await page.click('button[data-testid="ai-chat-floating-btn"]');

    // Click starter chip
    const starterChip = page.locator('button:has-text("Menu mana yang margin keuntungannya paling rendah?")');
    await expect(starterChip).toBeVisible();
    await starterChip.click();

    // Verify user bubble & response bubble
    await expect(page.locator('[data-testid="ai-message-user"]')).toContainText(
      'Menu mana yang margin keuntungannya paling rendah?'
    );
    await expect(page.locator('[data-testid="ai-message-assistant"]')).toContainText(
      'Menu dengan margin terendah adalah'
    );
  });

  test('UI Navigation: History list view displays previous conversations and switches back', async ({
    authedPage: page,
  }) => {
    const mockConversations = [
      {
        id: 'conv-hist-1',
        title: 'Analisis Stok Bahan Baku',
        last_message: 'Stok mentega tersisa 5 kg',
        message_count: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'conv-hist-2',
        title: 'Review Margin Penjualan',
        last_message: 'Laba kotor mencapai 42%',
        message_count: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    await page.route('**/store/ai/conversations?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: mockConversations,
            total: 2,
            page: 1,
            limit: 30,
            total_pages: 1,
          },
        }),
      });
    });

    await page.route('**/store/ai/conversations/active*', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'No active conversation' }),
      });
    });

    // Open drawer
    await page.click('button[data-testid="ai-chat-floating-btn"]');

    // Click history button in drawer header
    const historyBtn = page.locator('button[data-testid="ai-history-btn"]');
    await expect(historyBtn).toBeVisible();
    await historyBtn.click();

    // Verify History view header
    await expect(page.locator('text=Riwayat Sesi Percakapan')).toBeVisible();
    await expect(page.locator('text=2 sesi percakapan tersimpan')).toBeVisible();

    // Verify history items are rendered
    await expect(page.locator('text=Analisis Stok Bahan Baku')).toBeVisible();
    await expect(page.locator('text=Review Margin Penjualan')).toBeVisible();

    // Click back button to return to chat view
    const backBtn = page.locator('button[data-testid="ai-back-btn"]');
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // View should switch back to active chat
    await expect(page.locator('text=Percakapan Baru')).toBeVisible();
  });

  test('Multi-Session Lifecycle: Starts Session A, initiates new Session B, and isolates history', async ({
    authedPage: page,
  }) => {
    let convList = [
      {
        id: 'session-a',
        title: 'Pertanyaan Sesi A',
        last_message: 'Jawaban Sesi A',
        message_count: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    await page.route('**/store/ai/conversations/active*', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'None' }),
      });
    });

    await page.route('**/store/ai/conversations?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: convList, total: convList.length, page: 1, limit: 30, total_pages: 1 },
        }),
      });
    });

    await page.route('**/store/ai/conversations/session-a*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'session-a',
            store_id: 'store-1',
            user_id: 'user-1',
            title: 'Pertanyaan Sesi A',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            messages: [
              { id: 'm1', role: 'user', content: 'Pertanyaan Sesi A', created_at: new Date().toISOString() },
              { id: 'm2', role: 'assistant', content: 'Jawaban Sesi A', created_at: new Date().toISOString() },
            ],
          },
        }),
      });
    });

    await page.route('**/store/ai/conversations', async (route) => {
      if (route.request().method() === 'POST') {
        const payload = JSON.parse(route.request().postData() || '{}');
        const isSessionB = payload.message.includes('Sesi B');
        const newId = isSessionB ? 'session-b' : 'session-a';

        if (isSessionB) {
          convList = [
            {
              id: 'session-b',
              title: 'Pertanyaan Sesi B',
              last_message: 'Jawaban Sesi B',
              message_count: 2,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            ...convList,
          ];
        }

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              conversation_id: newId,
              message_id: `msg-${newId}`,
              role: 'assistant',
              content: isSessionB ? 'Jawaban Sesi B' : 'Jawaban Sesi A',
              created_at: new Date().toISOString(),
            },
          }),
        });
      } else {
        await route.fallback();
      }
    });

    // 1. Open drawer and send message in Session A
    await page.click('button[data-testid="ai-chat-floating-btn"]');
    const input = page.locator('textarea[data-testid="ai-chat-input"]');
    await input.fill('Pertanyaan Sesi A');
    await page.click('button[data-testid="ai-chat-send-btn"]');
    await expect(page.locator('text=Jawaban Sesi A')).toBeVisible();

    // 2. Click "+ Sesi Baru" button
    const newChatBtn = page.locator('button[data-testid="ai-new-chat-btn"]');
    await expect(newChatBtn).toBeVisible();
    await newChatBtn.click();

    // 3. Verify clean slate for Session B
    await expect(page.locator('text=Percakapan Baru')).toBeVisible();
    await expect(page.locator('text=Jawaban Sesi A')).not.toBeVisible();

    // 4. Send message in Session B
    await input.fill('Pertanyaan Sesi B');
    await page.click('button[data-testid="ai-chat-send-btn"]');
    await expect(page.locator('text=Jawaban Sesi B')).toBeVisible();
    await expect(page.locator('text=Jawaban Sesi A')).not.toBeVisible();

    // 5. Open Session List to verify both sessions exist
    await page.click('button[data-testid="ai-history-btn"]');
    await expect(page.locator('text=Pertanyaan Sesi B')).toBeVisible();
    await expect(page.locator('text=Pertanyaan Sesi A')).toBeVisible();

    // 6. Click Session A card to switch back
    await page.click('[data-testid="ai-history-item-session-a"]');
    await expect(page.locator('[data-testid="ai-message-user"]').filter({ hasText: 'Pertanyaan Sesi A' })).toBeVisible();
    await expect(page.locator('[data-testid="ai-message-assistant"]').filter({ hasText: 'Jawaban Sesi A' })).toBeVisible();
    await expect(page.locator('text=Jawaban Sesi B')).not.toBeVisible();
  });

  test('Edge Case: Displays quota exceeded alert banner when daily limit is reached', async ({
    authedPage: page,
  }) => {
    await page.route('**/store/ai/conversations/active*', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'No active conversation' }),
      });
    });

    await page.route('**/store/ai/conversations?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: [], total: 0, page: 1, limit: 30, total_pages: 0 },
        }),
      });
    });

    // Mock 403 QUOTA_EXCEEDED response
    await page.route('**/store/ai/conversations', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: 'QUOTA_EXCEEDED',
            errors: {
              code: 'QUOTA_EXCEEDED',
              limit: 10,
              used: 10,
            },
          }),
        });
      } else {
        await route.fallback();
      }
    });

    // Open drawer
    await page.click('button[data-testid="ai-chat-floating-btn"]');

    // Type and send message
    const chatInput = page.locator('textarea[data-testid="ai-chat-input"]');
    await chatInput.fill('Pertanyaan ke-11 melebihi kuota harian');
    await page.click('button[data-testid="ai-chat-send-btn"]');

    // Quota banner should be visible
    await expect(page.locator('text=Batas Kuota AI Tercapai')).toBeVisible();
    await expect(page.locator('text=Batas kuota pertanyaan AI hari ini telah tercapai (10 pertanyaan/hari)')).toBeVisible();

    // Send button should be disabled
    const sendBtn = page.locator('button[data-testid="ai-chat-send-btn"]');
    await expect(sendBtn).toBeDisabled();
  });

  test('Resilient Chat: Persists user message and allows inline retry when AI generation fails', async ({
    authedPage: page,
  }) => {
    await page.route('**/store/ai/conversations/active*', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'None' }),
      });
    });

    await page.route('**/store/ai/conversations?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: [], total: 0, page: 1, limit: 30, total_pages: 0 },
        }),
      });
    });

    // Mock initial failure response (is_error: true)
    await page.route('**/store/ai/conversations', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              conversation_id: 'conv-resilient-1',
              message_id: 'msg-err-1',
              role: 'assistant',
              content: 'Maaf, asisten AI mengalami kendala koneksi atau server sedang sibuk. Silakan klik tombol \'Coba Lagi\' untuk memproses ulang pertanyaan Anda.',
              is_error: true,
              created_at: new Date().toISOString(),
            },
          }),
        });
      } else {
        await route.fallback();
      }
    });

    // Mock retry endpoint success
    await page.route('**/store/ai/conversations/conv-resilient-1/retry*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            conversation_id: 'conv-resilient-1',
            message_id: 'msg-success-2',
            role: 'assistant',
            content: 'Berhasil diproses setelah retry: Semua persediaan bahan dalam kondisi aman.',
            is_error: false,
            created_at: new Date().toISOString(),
          },
        }),
      });
    });

    // Open drawer
    await page.click('button[data-testid="ai-chat-floating-btn"]');
    const input = page.locator('textarea[data-testid="ai-chat-input"]');
    await input.fill('Cek stok bahan kritis');
    await page.click('button[data-testid="ai-chat-send-btn"]');

    // 1. User message bubble remains visible in conversation!
    const userBubble = page.locator('[data-testid="ai-message-user"]').filter({ hasText: 'Cek stok bahan kritis' });
    await expect(userBubble).toBeVisible();

    // 2. Assistant bubble shows friendly error notice
    await expect(page.locator('text=Maaf, asisten AI mengalami kendala koneksi')).toBeVisible();

    // 3. Retry button is rendered
    const retryBtn = page.locator('button[data-testid="ai-retry-btn"]');
    await expect(retryBtn).toBeVisible();
    await expect(retryBtn).toContainText('Coba Lagi');

    // 4. Click retry button
    await retryBtn.click();

    // 5. Verify successful recovery without losing original user prompt
    await expect(page.locator('text=Berhasil diproses setelah retry')).toBeVisible();
    await expect(userBubble).toBeVisible();
    await expect(retryBtn).not.toBeVisible();
  });
});
