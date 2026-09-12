# Chat & Voice Search (`src/application/chat`)

- `POST /chat` — public, không cần login, rate-limit riêng (`CHAT_RATE_MAX`/`CHAT_RATE_WINDOW`), cần `GEMINI_API_KEY`
- RAG: embed message mới nhất (`embedQuery`) → top 8 sản phẩm gần nhất qua pgvector (`findSimilarByVector`) → enrich giá/property (`buildCatalogueProducts`) → inject vào system prompt
- Trích price filter từ câu hỏi qua Gemini structured output (`ProductFilterExtractionPort`), áp `EXISTS` subquery lên `product_variants`
- Fallback chain (luôn giữ price filter): vector lỗi/rỗng → `ilike` keyword → sản phẩm mới nhất
- Fail-soft: lỗi ở bước `ChatPort.reply` (sau khi retrieval xong) → trả `200` + apology string cố định, KHÔNG throw
- Prompt injection defense: mọi tin nhắn khách (role `user`, kể cả lịch sử) bọc trong tag `<user_message>`
- Voice search (`POST /search/voice`): audio → convert WAV (ffmpeg) → transcribe + embed song song (`embedAudioQuery`, cùng vector space với product embedding) — cả audio embedding lẫn transcript đều dùng để search
- Giới hạn audio: `SEARCH_VOICE_MAX_DURATION_SECONDS`, 10MB, check bằng ffprobe trước khi convert
