// Mock data and state helpers for T2 (Trang chủ). Not part of the component library.
import templeDuskBg from "../../assets/hub/bg/temple-dusk-1920.webp";
import templeSunsetBg from "../../assets/hub/bg/temple-sunset.webp";
import villageDuskBg from "../../assets/hub/bg/village-dusk-1920.webp";
import villageSunsetBg from "../../assets/hub/bg/village-sunset.webp";

export type HeroSlideKind = "tournament" | "software" | "coregame" | "event";

export interface HeroSlide {
  id: string;
  kind: HeroSlideKind;
  badge: string;
  title: string;
  description: string;
  bgImage: string;
  /** Linked product + version for software / coregame slides. */
  product?: ChangelogProduct;
  version?: string;
}

export type ChangelogProduct = "software" | "coregame";
export type ChangelogTag = "Mới" | "Sửa lỗi" | "Cân bằng" | "Hiệu năng";

export interface ChangelogEntry {
  product: ChangelogProduct;
  version: string;
  date: string;
  tags: ChangelogTag[];
  highlights: string[];
  details: { tag: ChangelogTag; items: string[] }[];
}

export const HERO_STATIC_SLIDES: HeroSlide[] = [
  {
    id: "slide-software",
    kind: "software",
    badge: "Phần mềm mới",
    title: "SuperAoE Hub 1.0.40 — Voice chat & Trạm TURN",
    description:
      "Nói chuyện trực tiếp trong phòng đấu không qua máy chủ, hỗ trợ trạm trung chuyển TURN giúp giảm giật khi mạng yếu.",
    bgImage: villageSunsetBg,
    product: "software",
    version: "1.0.40",
  },
  {
    id: "slide-coregame",
    kind: "coregame",
    badge: "Core game mới",
    title: "Core 1.0c — Áp dụng cấu hình ngay trong trận",
    description:
      "Thay đổi độ phân giải, chế độ cửa sổ không viền và VSync tức thì mà không cần khởi động lại game.",
    bgImage: templeDuskBg,
    product: "coregame",
    version: "1.0c-r4",
  },
  {
    id: "slide-event",
    kind: "event",
    badge: "Sự kiện",
    title: "Tuần lễ Giao lưu Clan — Khung Huy Hiệu Mùa Thu",
    description:
      "Hoàn thành 5 trận phòng Clan từ 13/11 đến 20/11 để nhận khung avatar Đá Sa Thạch trong Kho đồ.",
    bgImage: templeSunsetBg,
  },
  {
    id: "slide-feature",
    kind: "software",
    badge: "Phần mềm mới",
    title: "Hệ thống Giải đấu & Nhánh đấu trực tiếp",
    description:
      "Đăng ký đội, theo dõi đếm ngược, xem tỉ số trực tiếp và cập nhật bảng kết quả ngay trên hub.",
    bgImage: villageDuskBg,
    product: "software",
    version: "1.0.39",
  },
];

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  // Software (launcher / hub) — 6 versions
  {
    product: "software",
    version: "1.0.40",
    date: "13/11",
    tags: ["Mới", "Hiệu năng"],
    highlights: [
      "Trang Cài đặt mới: cấu hình game áp dụng ngay, kiểm tra mạng 3 bước và thử mic trực tiếp.",
      "Thêm trạm trung chuyển TURN tự động bật khi máy rảnh và đủ điều kiện.",
    ],
    details: [
      {
        tag: "Mới",
        items: [
          "Voice chat ngang hàng (P2P) trong phòng chơi với phím Nhấn để nói hoặc tự động theo ngưỡng dB.",
          "Kiểm tra mạng đo ping tới relay, loại NAT và trạng thái UPnP.",
          "Khôi phục mặc định riêng từng mục cài đặt kèm hộp thoại xác nhận.",
        ],
      },
      {
        tag: "Hiệu năng",
        items: [
          "Giảm độ trễ chuyển màn giữa Sảnh, Phòng chơi và Hồ sơ.",
        ],
      },
    ],
  },
  {
    product: "software",
    version: "1.0.39",
    date: "08/11",
    tags: ["Mới", "Sửa lỗi"],
    highlights: [
      "Ra mắt trang Clan: tìm clan, gửi đơn xin vào và bảng quản lý thành viên.",
      "Sửa lỗi mất đồng bộ danh sách phòng khi rời phòng nhanh.",
    ],
    details: [
      {
        tag: "Mới",
        items: [
          "Trang Clan với 5 mục: Tổng quan, Thành viên, Đơn xin vào, Thành tích, Quản lý.",
          "Bộ lọc phòng của clan tôi ngay trong Sảnh.",
        ],
      },
      {
        tag: "Sửa lỗi",
        items: [
          "Khắc phục trạng thái Sẵn sàng không cập nhật khi đổi phe liên tục.",
        ],
      },
    ],
  },
  {
    product: "software",
    version: "1.0.38",
    date: "01/11",
    tags: ["Mới"],
    highlights: [
      "Trang Hồ sơ mới với Kho đồ trang trí và thành tựu theo mùa.",
    ],
    details: [
      {
        tag: "Mới",
        items: [
          "Ghim tối đa 3 thành tựu nổi bật trên đầu hồ sơ.",
          "Xem bạn chung khi mở hồ sơ của người chơi khác.",
        ],
      },
    ],
  },
  {
    product: "software",
    version: "1.0.37",
    date: "24/10",
    tags: ["Cân bằng", "Sửa lỗi"],
    highlights: [
      "Cải thiện hiển thị nhánh đấu giải 16 và 32 đội.",
    ],
    details: [
      {
        tag: "Cân bằng",
        items: [
          "Mở rộng giới hạn chỗ khán giả thêm 2 ghế cho QTV.",
        ],
      },
      {
        tag: "Sửa lỗi",
        items: [
          "Sửa lỗi không mở được bảng tạo phòng bằng phím Enter.",
        ],
      },
    ],
  },
  {
    product: "software",
    version: "1.0.36",
    date: "15/10",
    tags: ["Hiệu năng"],
    highlights: [
      "Tối ưu tải sprite sheet và giảm dung lượng bộ nhớ khi mở nhiều tab.",
    ],
    details: [
      {
        tag: "Hiệu năng",
        items: [
          "Nén ảnh nền khu vực sảnh sang WebP giảm 45% thời gian tải.",
        ],
      },
    ],
  },
  {
    product: "software",
    version: "1.0.35",
    date: "05/10",
    tags: ["Mới"],
    highlights: [
      "Thêm thanh trạng thái kết nối và tự động thử kết nối lại mỗi 3 giây.",
    ],
    details: [
      {
        tag: "Mới",
        items: [
          "Hiển thị số lần thử lại và nút Thử ngay khi mất mạng.",
        ],
      },
    ],
  },

  // Core game — 6 versions
  {
    product: "coregame",
    version: "1.0c-r4",
    date: "12/11",
    tags: ["Mới", "Hiệu năng"],
    highlights: [
      "Áp dụng trực tiếp độ phân giải, VSync và giữ tỉ lệ hình khi game đang chạy.",
      "Giảm giật khung hình khi đông quân ở chế độ 1600×900 và 1920×1080.",
    ],
    details: [
      {
        tag: "Mới",
        items: [
          "Nhận cấu hình hiển thị từ Hub theo thời gian thực qua kênh nội bộ.",
          "Hỗ trợ chế độ Cửa sổ không viền chuyển Alt+Tab tức thì.",
        ],
      },
      {
        tag: "Hiệu năng",
        items: [
          "Tối ưu vẽ lại HUD tỉ lệ 4:3 cho 1024×768 và 1280×1024.",
        ],
      },
    ],
  },
  {
    product: "coregame",
    version: "1.0c-r3",
    date: "04/11",
    tags: ["Sửa lỗi"],
    highlights: [
      "Sửa lỗi kẹt phím tắt F3/F10 khi giữ phím voice chat toàn màn hình.",
    ],
    details: [
      {
        tag: "Sửa lỗi",
        items: [
          "Tách riêng phím Push-to-Talk khỏi hàng đợi phím lệnh của game.",
        ],
      },
    ],
  },
  {
    product: "coregame",
    version: "1.0c-r2",
    date: "27/10",
    tags: ["Cân bằng", "Sửa lỗi"],
    highlights: [
      "Tự chọn kích thước bản đồ theo số người chơi (Large / Huge / Gigantic).",
    ],
    details: [
      {
        tag: "Cân bằng",
        items: [
          "1–4 người mặc định Large, 5–6 người Huge, 7–8 người Gigantic.",
        ],
      },
      {
        tag: "Sửa lỗi",
        items: [
          "Khắc phục sai lệch đồng hồ dân số khi tạm dừng trận.",
        ],
      },
    ],
  },
  {
    product: "coregame",
    version: "1.0c-r1",
    date: "18/10",
    tags: ["Hiệu năng"],
    highlights: [
      "Đồng bộ khung hình ổn định hơn trong trận 4v4 qua mạng relay.",
    ],
    details: [
      {
        tag: "Hiệu năng",
        items: [
          "Giảm gói tin thừa ở bước xác nhận lượt (lockstep).",
        ],
      },
    ],
  },
  {
    product: "coregame",
    version: "1.0c-b9",
    date: "09/10",
    tags: ["Sửa lỗi"],
    highlights: [
      "Sửa lỗi văng game khi khán giả vào xem trận đang ở phút thứ 30+.",
    ],
    details: [
      {
        tag: "Sửa lỗi",
        items: [
          "Ổn định đồng bộ lịch sử lệnh cho người xem vào muộn.",
        ],
      },
    ],
  },
  {
    product: "coregame",
    version: "1.0c-b8",
    date: "01/10",
    tags: ["Mới"],
    highlights: [
      "Chuẩn hoá đường dẫn EMPIRESX.EXE và kiểm tra chữ ký tệp khi khởi chạy.",
    ],
    details: [
      {
        tag: "Mới",
        items: [
          "Cảnh báo sớm nếu thiếu tệp dữ liệu bản đồ mặc định.",
        ],
      },
    ],
  },
];

const SEEN_KEY = "aoe-hub.seen-changelog.v1";

export function loadSeenVersions(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? new Set(arr.filter((v): v is string => typeof v === "string")) : new Set();
  } catch {
    return new Set();
  }
}

export function saveSeenVersions(seen: Set<string>): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    /* ignore storage errors */
  }
}

export function clearSeenVersions(): void {
  try {
    localStorage.removeItem(SEEN_KEY);
  } catch {
    /* ignore */
  }
}

export type HomeTournamentScenario = "normal" | "empty" | "live" | "champion";
export type HomeLoadState = "ready" | "loading" | "error";

export interface HomeMockConfig {
  slideCount: number;
  includeTournamentSlide: boolean;
  tournamentScenario: HomeTournamentScenario;
  suggestedRoomCount: number;
  onlineFriendsCount: number;
  hasUnseenChangelog: boolean;
  loadState: HomeLoadState;
}

export const DEFAULT_HOME_MOCK: HomeMockConfig = {
  slideCount: 4,
  includeTournamentSlide: true,
  tournamentScenario: "normal",
  suggestedRoomCount: 4,
  onlineFriendsCount: 10,
  hasUnseenChangelog: true,
  loadState: "ready",
};

