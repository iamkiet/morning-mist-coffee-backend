export function splitDescription(raw: string): {
  origin: string | null;
  tastingNotes: string[];
  description: string | null;
} {
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { origin: null, tastingNotes: [], description: null };
  if (lines.length === 1) return { origin: null, tastingNotes: [], description: lines[0]! };
  return {
    origin: lines[0]!,
    tastingNotes: lines.slice(1, -1),
    description: lines.at(-1)!,
  };
}

export const types = [{ name: 'Arabica' }, { name: 'Robusta' }];

export const coffeeProducts = [
  {
    type: 'Arabica',
    name: 'Cà phê Phối Trộn Arabica Morning Mist',
    description:
      'Phối trộn • Morning Mist\nSô-cô-la sữa\nCaramel\nCam nhẹ\nVị dịu, không chua gắt cũng không đắng nhiều. Hợp cho người mới tập uống cà phê và cho ly đầu tiên buổi sáng.',
    priceCents: 55000,
    stock: 50,
    image: 'https://todaywegrind.com/products/coffee1.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Arabica Cầu Đất Đà Lạt',
    description:
      'Cầu Đất • Đà Lạt\nHoa nhài\nChua thanh\nHậu vị sạch\nArabica trồng trên cao nguyên Đà Lạt, rang nhạt để giữ mùi hoa. Chua thanh nhẹ như trái cây, uống đen ngon hơn pha sữa.',
    priceCents: 65000,
    stock: 30,
    image: 'https://todaywegrind.com/products/coffee2.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Arabica Chế Biến Mật Ong',
    description:
      'Chế biến mật ong • Lâm Đồng\nNgọt mật ong\nQuả mọng\nÍt chua\nHạt được phơi còn nguyên lớp nhựa ngọt nên vị ngọt tự nhiên rõ, chua rất nhẹ. Pha phin hay ủ lạnh cold brew đều hợp.',
    priceCents: 60000,
    stock: 40,
    image: 'https://todaywegrind.com/products/coffee3.png',
  },
  {
    type: 'Robusta',
    name: 'Cà phê Robusta Espresso Đậm Đà',
    description:
      'Espresso • Việt Nam\nĐắng đậm\nNhiều caffeine\nCrema dày\nRobusta rang cho máy espresso, lớp crema dày và vị đắng mạnh. Pha với sữa đặc thành cà phê sữa đá rất hợp, uống vào là tỉnh ngủ.',
    priceCents: 45000,
    stock: 60,
    image: 'https://todaywegrind.com/products/coffee4.png',
  },
  {
    type: 'Robusta',
    name: 'Cà phê Robusta Rang Đậm',
    description:
      'Rang đậm • Việt Nam\nSô-cô-la đen\nMùi khói\nĐắng gắt\nRang thật đậm nên vị đắng mạnh và thoảng mùi khói. Dành cho người quen uống cà phê đậm kiểu truyền thống, không thích vị chua.',
    priceCents: 50000,
    stock: 45,
    image: 'https://todaywegrind.com/products/coffee5.png',
  },
  {
    type: 'Robusta',
    name: 'Cà phê Robusta Rang Bơ',
    description:
      'Rang bơ • Việt Nam\nThơm bơ\nBéo ngậy\nNgọt hậu\nRobusta rang với bơ theo kiểu quán cóc Việt Nam, thơm béo và ngọt hậu. Loại quen thuộc để pha phin uống với sữa đặc.',
    priceCents: 48000,
    stock: 55,
    image: 'https://todaywegrind.com/products/coffee6.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Ethiopian Yirgacheffe',
    description:
      'Yirgacheffe • Ethiopia\nHoa nhài\nQuả mọng\nVị trà\nCà phê từ quê hương của cây cà phê, thơm mùi hoa và quả mọng, uống nhẹ như trà. Chua thanh rõ, nên uống đen để cảm nhận hết mùi.',
    priceCents: 75000,
    stock: 35,
    image: 'https://todaywegrind.com/products/coffee7.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Colombian Geisha',
    description:
      'Huila • Colombia\nHương hoa\nCam quýt\nQuý hiếm\nGiống Geisha quý hiếm, hương hoa và cam quýt nổi bật. Hàng cao cấp, thường để pha thủ công cho người sành hoặc làm quà tặng.',
    priceCents: 95000,
    stock: 15,
    image: 'https://todaywegrind.com/products/coffee8.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Brazil Chế Biến Tự Nhiên',
    description:
      'Cerrado • Brazil\nHạt dẻ\nSô-cô-la\nÍt chua\nPhơi nguyên trái nên vị ngọt đậm, thơm hạt dẻ và sô-cô-la, gần như không chua. Nền espresso dễ uống, hợp pha với sữa.',
    priceCents: 58000,
    stock: 48,
    image: 'https://todaywegrind.com/products/coffee9.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Kenya AA',
    description:
      'Nyeri • Kenya\nLý chua đen\nChua sáng\nHương hoa\nHạt loại AA to đều của Kenya, vị chua sáng rõ như trái cây chín và hậu vị ngọt. Dành cho người thích cà phê chua thanh, uống đen.',
    priceCents: 80000,
    stock: 28,
    image: 'https://todaywegrind.com/products/coffee10.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Ấn Độ Monsoon Malabar',
    description:
      'Malabar • Ấn Độ\nKhông chua\nGia vị\nVị đất\nHạt được hong gió mùa biển nhiều tuần nên gần như mất hết vị chua, còn lại vị trầm đậm và thoảng mùi gia vị. Lạ miệng, hợp người không chịu được cà phê chua.',
    priceCents: 52000,
    stock: 38,
    image: 'https://todaywegrind.com/products/coffee11.png',
  },
  {
    type: 'Robusta',
    name: 'Cà phê Robusta Lampung',
    description:
      'Lampung • Indonesia\nVị đất\nThảo mộc\nĐậm đà\nRobusta trồng ở Lampung trên đảo Sumatra, vị đậm và trầm với mùi thảo mộc, gỗ. Đắng rõ, gần như không chua, hợp pha phin đặc.',
    priceCents: 49000,
    stock: 42,
    image: 'https://todaywegrind.com/products/coffee12.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Guatemala Huehuetenango',
    description:
      'Huehuetenango • Guatemala\nSô-cô-la\nCam quýt\nCân bằng\nTrồng trên núi cao, vị cân bằng giữa ngọt sô-cô-la và chua nhẹ của cam. Dễ uống, pha kiểu nào cũng hợp.',
    priceCents: 62000,
    stock: 36,
    image: 'https://todaywegrind.com/products/coffee13.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Costa Rica Tarrazú',
    description:
      'Tarrazú • Costa Rica\nCaramel\nSô-cô-la sữa\nChua dịu\nVị ngọt caramel rõ, chua rất dịu và hậu vị mượt. Lựa chọn an toàn nếu bạn muốn thử cà phê ngoại mà sợ chua.',
    priceCents: 60000,
    stock: 41,
    image: 'https://todaywegrind.com/products/coffee14.png',
  },
  {
    type: 'Robusta',
    name: 'Cà phê Robusta Buôn Ma Thuột',
    description:
      'Buôn Ma Thuột • Đắk Lắk\nVị đất\nSô-cô-la đen\nGiá mềm\nRobusta từ thủ phủ cà phê Việt Nam, đậm và đắng rõ, giá dễ chịu nhất quán. Loại dùng hằng ngày để pha phin.',
    priceCents: 42000,
    stock: 65,
    image: 'https://todaywegrind.com/products/coffee15.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Panama Geisha',
    description:
      'Boquete • Panama\nHoa nhài\nTrái cây nhiệt đới\nCao cấp nhất\nGeisha Panama, dòng đắt nhất ở đây, hương hoa nhài và trái cây chín rất rõ. Số lượng có hạn, nên pha thủ công để không phí.',
    priceCents: 120000,
    stock: 10,
    image: 'https://todaywegrind.com/products/coffee16.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Peru Hữu Cơ',
    description:
      'Cajamarca • Peru\nHữu cơ\nSô-cô-la\nHạt dẻ\nCà phê đạt chứng nhận hữu cơ, trồng không dùng hoá chất. Vị cân bằng, ngọt nhẹ, chua vừa phải, uống hằng ngày không ngán.',
    priceCents: 58000,
    stock: 44,
    image: 'https://todaywegrind.com/products/coffee17.png',
  },
  {
    type: 'Robusta',
    name: 'Cà phê Robusta Uganda',
    description:
      'Hồ Victoria • Uganda\nĐậm đà\nGia vị\nHậu vị đất\nRobusta châu Phi mọc quanh hồ Victoria, vị mạnh và có nét gia vị cay nhẹ. Nhiều caffeine, hợp người cần tỉnh táo cả ngày.',
    priceCents: 50000,
    stock: 39,
    image: 'https://todaywegrind.com/products/coffee18.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Tanzania Kilimanjaro',
    description:
      'Kilimanjaro • Tanzania\nChua như vang\nTrái cây\nThơm nhẹ\nTrồng trên sườn núi Kilimanjaro, vị chua sáng giống rượu vang và nhiều hương trái cây. Uống đen buổi sáng rất tỉnh người.',
    priceCents: 70000,
    stock: 33,
    image: 'https://todaywegrind.com/products/coffee19.png',
  },
  {
    type: 'Arabica',
    name: 'Cà phê Mexico Oaxaca',
    description:
      'Oaxaca • Mexico\nGia vị nhẹ\nSô-cô-la\nNhẹ nhàng\nVị nhẹ nhàng, ngọt sô-cô-la và thoảng gia vị, chua vừa phải. Loại dễ uống cho người không thích cà phê quá đậm.',
    priceCents: 55000,
    stock: 47,
    image: 'https://todaywegrind.com/products/coffee20.png',
  },
] satisfies {
  type: 'Arabica' | 'Robusta';
  name: string;
  description: string;
  priceCents: number;
  stock: number;
  image: string;
}[];
