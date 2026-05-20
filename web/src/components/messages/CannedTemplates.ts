export interface CannedResponse {
  key: string
  label: string
  text: string
}

/**
 * Hospitality canned-response templates in Vietnamese, used by the admin
 * dashboard. The translation pipeline localizes them per guest language at
 * send time.
 */
export const DEFAULT_TEMPLATES: CannedResponse[] = [
  {
    key: 'greeting',
    label: '👋 Chào mừng',
    text: 'Xin chào quý khách! Cảm ơn quý khách đã liên hệ với khách sạn. Chúng tôi rất vui được hỗ trợ.',
  },
  {
    key: 'rooms-available',
    label: '✅ Còn phòng',
    text: 'Vâng, chúng tôi vẫn còn phòng trống cho ngày quý khách yêu cầu. Quý khách muốn đặt phòng loại nào ạ?',
  },
  {
    key: 'rooms-unavailable',
    label: '❌ Hết phòng',
    text: 'Rất tiếc, ngày quý khách yêu cầu đã hết phòng. Quý khách có thể chọn ngày khác hoặc loại phòng khác giúp chúng tôi nhé.',
  },
  {
    key: 'price',
    label: '💰 Báo giá',
    text: 'Giá phòng của chúng tôi từ {price} VND/đêm, đã bao gồm thuế và phí dịch vụ. Bữa sáng được phục vụ miễn phí cho quý khách.',
  },
  {
    key: 'check-in-time',
    label: '🕒 Giờ check-in',
    text: 'Giờ nhận phòng tiêu chuẩn của chúng tôi là 14:00 và trả phòng là 12:00. Nếu quý khách cần nhận phòng sớm hoặc muộn, vui lòng cho chúng tôi biết.',
  },
  {
    key: 'late-checkin-ok',
    label: '🌙 Nhận phòng muộn',
    text: 'Chúng tôi đã ghi nhận yêu cầu nhận phòng muộn. Lễ tân của chúng tôi trực 24/7 để đón quý khách bất kỳ lúc nào.',
  },
  {
    key: 'airport-pickup',
    label: '✈️ Đưa đón sân bay',
    text: 'Chúng tôi cung cấp dịch vụ đưa đón sân bay với mức phí hợp lý. Quý khách vui lòng cho biết giờ bay và số chuyến bay để chúng tôi sắp xếp.',
  },
  {
    key: 'breakfast',
    label: '🥐 Bữa sáng',
    text: 'Bữa sáng buffet được phục vụ miễn phí từ 06:30 đến 10:00 tại nhà hàng tầng 2.',
  },
  {
    key: 'cancellation',
    label: '📋 Chính sách hủy',
    text: 'Quý khách có thể hủy miễn phí trước 48 giờ so với giờ nhận phòng. Sau thời gian này sẽ phụ thu phí 1 đêm.',
  },
  {
    key: 'thanks',
    label: '🙏 Cảm ơn',
    text: 'Cảm ơn quý khách rất nhiều! Chúng tôi rất mong được đón tiếp quý khách. Chúc quý khách một ngày tốt lành.',
  },
]
