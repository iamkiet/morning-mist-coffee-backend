# Chat (`src/application/chat`)

- `POST /chat` — text, public, không cần login, rate-limit riêng (`CHAT_RATE_MAX`/`CHAT_RATE_WINDOW`), cần `GEMINI_API_KEY`
- `POST /chat/voice` — cùng feature, input là audio (multipart, field `messages` chứa lịch sử JSON + file audio), rate-limit riêng (`SEARCH_VOICE_RATE_MAX`/`SEARCH_VOICE_RATE_WINDOW`)
- Cả hai route dùng chung `SendChatMessageUseCase` → chung `AnswerQueryService.answer()` (retrieval + reply + hậu xử lý), khác nhau ở nguồn vector: text nhúng qua `embedChatQuery`, audio nhúng trực tiếp qua `embedAudioQuery` (không qua transcript) — transcript chỉ dùng để hiển thị lại và làm câu hỏi cho catalogue/price-filter extraction
- Voice: audio → convert WAV (ffmpeg) → transcribe (`TranscriptionPort`) song song với embed audio; giới hạn `SEARCH_VOICE_MAX_DURATION_SECONDS`, 10MB, check bằng ffprobe trước khi convert
- RAG (chung cho cả hai): embed câu hỏi → top 8 sản phẩm gần nhất qua pgvector (`findSimilarByVector`) → enrich giá/property (`buildCatalogueProducts`) → inject vào system prompt; output cuối cùng attach variants (`attachVariants`) + ưu tiên biến thể theo khối lượng nếu có (`preferVariantByWeight`)
- Trích price/weight filter từ câu hỏi qua Gemini structured output (`ChatFilterExtractionPort`), áp `EXISTS` subquery lên `product_variants` — khi có cả price và weight, ràng buộc CÙNG một biến thể (join qua property "Trọng lượng" trong subquery `variantMatchExists`), không phải "sản phẩm có bất kỳ biến thể nào khớp giá" độc lập với "có bất kỳ biến thể nào khớp khối lượng"
- Fallback chain (luôn giữ price + weight filter): vector lỗi/rỗng → `ilike` keyword → sản phẩm mới nhất
- Fail-soft: lỗi ở bước `ChatPort.reply` (sau khi retrieval xong) → trả `200` + apology string cố định, KHÔNG throw
- Prompt injection defense: mọi tin nhắn khách (role `user`, kể cả lịch sử) bọc trong tag `<user_message>`
