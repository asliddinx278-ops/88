const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  try { tg.setHeaderColor('#0D0D1A'); } catch(e) {}
  try { tg.setBackgroundColor('#0D0D1A'); } catch(e) {}
}

let userId = null;
let userName = '';
let userFirstName = '';
let __sessionId = null; // UNIQUE per page load for guest isolation

function getSessionId() {
  if (!__sessionId) {
    __sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  }
  return __sessionId;
}

if (tg?.initDataUnsafe?.user?.id) {
  userId = tg.initDataUnsafe.user.id;
  userName = tg.initDataUnsafe.user.username || '';
  userFirstName = tg.initDataUnsafe.user.first_name || '';
} else if (tg?.initData) {
  const params = new URLSearchParams(tg.initData);
  const userJson = params.get('user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      userId = user.id;
      userName = user.username || '';
      userFirstName = user.first_name || '';
    } catch (e) {}
  }
}

const PROFILE_STORAGE_PREFIX = 'dating_profile_';

function getProfileStorageKey(targetId = userId) {
  if (targetId && Number.isFinite(Number(targetId))) {
    return `${PROFILE_STORAGE_PREFIX}${Number(targetId)}`;
  }
  // Guest users get a unique session-based key so they don't share data
  return `${PROFILE_STORAGE_PREFIX}guest_${getSessionId()}`;
}

function removeLegacyProfileStorage() {
  try {
    localStorage.removeItem('dating_profile');
  } catch (e) {
    console.warn('Legacy profile storage cleanup failed', e);
  }
}

const API_BASE_URL = 'https://tanishuvbot-production.up.railway.app';
const DEFAULT_GROUP_INVITE_LINK = 'https://t.me/+HA4J8P7lht0zZTdi';

const MAX_WEBAPP_DATA_SIZE = 6000;
const MAX_INTERESTS_ALLOWED = 5;

function sendWebAppData(payload) {
  if (!tg) return;
  const json = JSON.stringify(payload);
  if (json.length <= MAX_WEBAPP_DATA_SIZE) {
    tg.sendData(json);
    return;
  }
  if (payload.action === 'save_profile' && payload.profile) {
    const safeProfile = { ...payload.profile, photo_base64: null };
    const safePayload = { ...payload, profile: safeProfile };
    const safeJson = JSON.stringify(safePayload);
    if (safeJson.length <= MAX_WEBAPP_DATA_SIZE) {
      tg.sendData(safeJson);
      showToast('Rasm telegramga yuborilmadi, lekin anketangiz saqlandi.');
      return;
    }
  }
  showToast('Xatolik: ma\'lumot juda uzun.');
}

const ICONS = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  male: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="6" r="4"/><line x1="12" y1="10" x2="12" y2="16"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="12" y1="16" x2="8" y2="22"/><line x1="12" y1="16" x2="16" y2="22"/></svg>`,
  female: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="6" r="4"/><path d="M6 20 L10 12 L14 12 L18 20"/><line x1="6" y1="18" x2="10" y2="12"/><line x1="18" y1="18" x2="14" y2="12"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  message: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
  ban: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
  camera: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  share: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  mapPin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  atSign: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
};

let selectedGender = '';
let selectedSearchGender = '';
let selectedInterests = [];
let selectedGoals = [];
let selectedSearchGoals = [];
let selectedSearchInterests = [];
let photoBase64 = '';
let photoReady = false;
let photoUploading = false;
// REMOVED: let savedProfile = null; — always read from storage per-user

const uzbekCities = [
  "Andijon shahri", "Xonobod shahri", "Asaka shahri", "Qorasuv shahri",
  "Andijon tumani", "Asaka tumani", "Baliqchi tumani", "Boʻston tumani",
  "Buloqboshi tumani", "Izboskan tumani", "Jalaquduq tumani", "Marhamat tumani",
  "Oltinkoʻl tumani", "Paxtaobod tumani", "Shahrixon tumani", "Ulugʻnor tumani",
  "Xoʻjaobod tumani", "Qoʻrgʻontepa tumani",
  "Buxoro shahri", "Kogon shahri", "Olot shahri", "Vobkent shahri",
  "Gazli shahri", "Galaosiyo shahri", "Gʻijduvon shahri", "Qorakoʻl shahri",
  "Qorovulbozor shahri", "Romitan shahri", "Shofirkon shahri",
  "Buxoro tumani", "Jondor tumani", "Kogon tumani", "Qorakoʻl tumani",
  "Qorovulbozor tumani", "Olot tumani", "Peshku tumani", "Romitan tumani",
  "Shofirkon tumani", "Vobkent tumani", "Gʻijduvon tumani",
  "Fargʻona shahri", "Qoʻqon shahri", "Margʻilon shahri", "Quvasoy shahri",
  "Quva shahri", "Rishton shahri", "Yaypan shahri", "Tinchlik shahri",
  "Bogʻdod tumani", "Beshariq tumani", "Buvayda tumani", "Dangʻara tumani",
  "Fargʻona tumani", "Furqat tumani", "Qoʻshtepa tumani", "Quva tumani",
  "Rishton tumani", "Soʻx tumani", "Toshloq tumani", "Uchkoʻprik tumani",
  "Oltiariq tumani", "Oʻzbekiston tumani", "Yozyovon tumani",
  "Jizzax shahri", "Dashtobod shahri",
  "Arnasoy tumani", "Baxmal tumani", "Doʻstlik tumani", "Forish tumani",
  "Gallaorol tumani", "Sharof Rashidov tumani", "Mirzachoʻl tumani",
  "Paxtakor tumani", "Yangiobod tumani", "Zomin tumani", "Zafarobod tumani",
  "Zarbdor tumani",
  "Urganch shahri", "Xiva shahri", "Pitnak shahri", "Gurlan shahri", "Shovot shahri",
  "Bogʻot tumani", "Gurlan tumani", "Qoʻshkoʻpir tumani", "Shovot tumani",
  "Yangiariq tumani", "Tuproqqalʼa tumani", "Urganch tumani", "Xonqa tumani",
  "Xiva tumani", "Hazorasp tumani", "Yangibozor tumani",
  "Namangan shahri", "Chust shahri", "Chartaq shahri", "Kosonsoy shahri",
  "Uchqoʻrgʻon shahri", "Haqqulobod shahri", "Toʻraqoʻrgʻon shahri", "Pop shahri",
  "Chartaq tumani", "Chust tumani", "Kosonsoy tumani", "Mingbuloq tumani",
  "Namangan tumani", "Norin tumani", "Pop tumani", "Toʻraqoʻrgʻon tumani",
  "Uychi tumani", "Uchqoʻrgʻon tumani", "Yangiqoʻrgʻon tumani", "Yangi Namangan tumani",
  "Navoiy shahri", "Zarafshon shahri", "Uchquduq shahri", "Nurota shahri",
  "Qiziltepa shahri", "Gʻozgʻon shahri",
  "Karmana tumani", "Konimex tumani", "Qiziltepa tumani", "Xatirchi tumani",
  "Navbahor tumani", "Nurota tumani", "Tomdi tumani", "Uchquduq tumani",
  "Qarshi shahri", "Shahrisabz shahri", "Kitob shahri", "Koson shahri",
  "Muborak shahri", "Yakkabogʻ shahri", "Gʻuzor shahri", "Kamashi shahri",
  "Chiroqchi tumani", "Dehqonobod tumani", "Kamashi tumani", "Qarshi tumani",
  "Koson tumani", "Koʻkdala tumani", "Kitob tumani", "Mirishkor tumani",
  "Muborak tumani", "Nishon tumani", "Kasbi tumani", "Shahrisabz tumani",
  "Yakkabogʻ tumani", "Gʻuzor tumani",
  "Samarqand shahri", "Kattaqoʻrgʻon shahri", "Urgut shahri", "Oqtosh shahri",
  "Bulungʻur shahri", "Jomboy shahri", "Chelak shahri", "Nurobod shahri",
  "Bulungʻur tumani", "Ishtixon tumani", "Jomboy tumani", "Kattaqoʻrgʻon tumani",
  "Qoʻshrabot tumani", "Narpay tumani", "Nurobod tumani", "Oqdaryo tumani",
  "Paxtachi tumani", "Payariq tumani", "Pastdargʻom tumani", "Samarqand tumani",
  "Toyloq tumani", "Urgut tumani",
  "Guliston shahri", "Shirin shahri", "Yangiyer shahri", "Baxt shahri",
  "Sirdaryo shahri",
  "Boyovut tumani", "Guliston tumani", "Xovos tumani", "Mirzaobod tumani",
  "Oqoltin tumani", "Sardoba tumani", "Sayxunobod tumani", "Sirdaryo tumani",
  "Termiz shahri", "Denov shahri", "Boysun shahri", "Jarqoʻrgʻon shahri",
  "Qumqoʻrgʻon shahri", "Shargʻun shahri", "Sherobod shahri", "Shoʻrchi shahri",
  "Angor tumani", "Boysun tumani", "Denov tumani", "Jarqoʻrgʻon tumani",
  "Qiziriq tumani", "Qumqoʻrgʻon tumani", "Muzrabot tumani", "Oltinsoy tumani",
  "Sariosiyo tumani", "Sherobod tumani", "Shoʻrchi tumani", "Termiz tumani",
  "Uzun tumani", "Bandixon tumani",
  "Nurafshon shahri", "Angren shahri", "Olmaliq shahri", "Chirchiq shahri",
  "Ohangaron shahri", "Bekobod shahri", "Yangiyoʻl shahri", "Gʻazalkent shahri",
  "Keles shahri", "Piskent shahri", "Chinoz shahri", "Boʻka shahri",
  "Oqqoʻrgʻon shahri", "Parkent shahri",
  "Bekobod tumani", "Boʻstonliq tumani", "Boʻka tumani", "Chinoz tumani",
  "Qibray tumani", "Ohangaron tumani", "Oqqoʻrgʻon tumani", "Parkent tumani",
  "Piskent tumani", "Quyi Chirchiq tumani", "Oʻrta Chirchiq tumani",
  "Yuqori Chirchiq tumani", "Zangiota tumani", "Toshkent tumani", "Yangiyoʻl tumani",
  "Nukus shahri", "Beruniy shahri", "Boʻston shahri", "Mangʻit shahri",
  "Moʻynoq shahri", "Taxiatosh shahri", "Toʻrtkoʻl shahri", "Xalqobod shahri",
  "Chimboy shahri", "Shumanay shahri", "Xoʻjayli shahri", "Qoʻngʻirot shahri",
  "Amudaryo tumani", "Beruniy tumani", "Chimboy tumani", "Ellikqalʼa tumani",
  "Kegeyli tumani", "Moʻynoq tumani", "Nukus tumani", "Qonlikoʻl tumani",
  "Qorauzyak tumani", "Qoʻngʻirot tumani", "Shumanay tumani", "Taxtakoʻpir tumani",
  "Toʻrtkoʻl tumani", "Xoʻjayli tumani", "Taxiatosh tumani", "Boʻzatov tumani",
  "Toshkent shahri"
];

// Chat state
let currentChatMatchId = null;
let currentChatPartner = null;
let chatRefreshInterval = null;
let chatsPollInterval = null;

// Message target for modal
let messageTargetUserId = null;
let messageTargetName = '';
let messageTargetPhoto = '';

// ===== LIMIT STATUS =====
let currentLimitStatus = null;

async function loadLimitStatus() {
  if (!userId) return;
  try {
    const data = await apiPost('/api/limits/status', { telegram_id: userId });
    if (data.success) {
      currentLimitStatus = data.limits;
      updateLimitBar(data.limits);
    }
  } catch (e) {
    console.error('Limit status load error:', e);
  }
}

function updateLimitBar(limits) {
  const bar = document.getElementById('limit-status-bar');
  if (!bar) return;

  if (limits.unlimited) {
    bar.style.display = 'flex';
    document.getElementById('limit-likes').textContent = '∞';
    document.getElementById('limit-messages').textContent = '∞';
    document.getElementById('limit-superlikes').textContent = '∞';
  } else {
    bar.style.display = 'flex';
    document.getElementById('limit-likes').textContent = limits.likes_remaining;
    document.getElementById('limit-messages').textContent = limits.messages_remaining;
    document.getElementById('limit-superlikes').textContent = limits.super_likes_remaining;
  }
}

// ===== LIMIT MODAL MATNI (YANGILANGAN) =====
function showLimitExceeded(type) {
  const modal = document.getElementById('limit-modal');
  const text = document.getElementById('limit-modal-text');
  if (modal && text) {
    const messages = {
      'likes': 'Sizning kunlik like limitingiz tugadi. Guruhga odam qo\'shib, limitni oshiring!',
      'messages': 'Sizning kunlik xabar yuborish limitingiz tugadi. Guruhga odam qo\'shib, limitni oshiring!',
      'super_likes': 'Sizning kunlik Super Like limitingiz tugadi. Guruhga odam qo\'shib, limitni oshiring!'
    };
    text.textContent = messages[type] || 'Kunlik limitingiz tugadi. Guruhga odam qo\'shib, limitni oshiring!';
    modal.style.display = 'flex';
  }
}

function closeLimitModal(e) {
  if (e && e.target !== e.currentTarget && e.target !== document.getElementById('limit-modal')) return;
  document.getElementById('limit-modal').style.display = 'none';
}

// ===== REFERRAL MODAL (YANGILANGAN - Guruhga odam qo'shish) =====
function applyGroupInviteLink(groupLink = DEFAULT_GROUP_INVITE_LINK) {
  const linkInput = document.getElementById('referral-link-input');
  const shareLink = document.getElementById('referral-share-link');

  if (linkInput) linkInput.value = groupLink;
  if (shareLink) {
    const text = encodeURIComponent('Tanishuv guruhiga qo\'shiling! Yangi do\'stlarni toping.');
    const url = encodeURIComponent(groupLink);
    shareLink.href = `https://t.me/share/url?url=${url}&text=${text}`;
  }
}

async function openReferralModal() {
  closeLimitModal();
  const modal = document.getElementById('referral-modal');
  if (!modal) return;

  applyGroupInviteLink();

  if (userId) {
    try {
      const data = await apiPost('/api/referral/status', { telegram_id: userId });
      if (data.success) {
        const stats = document.getElementById('referral-stats');

        const count = data.referral.group_invite_count || 0;
        const unlimited = data.referral.unlimited_until;
        const invitees = data.referral.group_invitees || [];

        let html = `👥 Guruhga taklif qilinganlar: <strong>${count}</strong> ta`;
        if (unlimited) {
          html += `<br>✅ Limitsiz davr: <strong>${new Date(unlimited).toLocaleDateString('uz-UZ')}</strong> gacha`;
        }
        if (invitees.length > 0) {
          html += `<br><br>📝 So'ngi taklif qilinganlar:<br>`;
          invitees.slice(0, 5).forEach(inv => {
            html += `• ${inv.full_name || 'Ismsiz'}<br>`;
          });
        }
        if (stats) stats.innerHTML = html;

        // Guruh invite link
        const groupLink = data.referral.referral_link || DEFAULT_GROUP_INVITE_LINK;
        applyGroupInviteLink(groupLink);
      }
    } catch (e) {
      console.error('Referral status error:', e);
      applyGroupInviteLink();
    }
  }

  modal.style.display = 'flex';
}

function closeReferralModal(e) {
  if (e && e.target !== e.currentTarget && e.target !== document.getElementById('referral-modal')) return;
  document.getElementById('referral-modal').style.display = 'none';
}

function copyReferralLink() {
  const input = document.getElementById('referral-link-input');
  if (input) {
    input.select();
    navigator.clipboard.writeText(input.value).then(() => {
      showToast('Link nusxalandi!');
    });
  }
}

// ===== MESSAGE MODAL =====
function openMessageModal(toUserId, name, photo) {
  messageTargetUserId = toUserId;
  messageTargetName = name;
  messageTargetPhoto = photo;
  document.getElementById('message-modal-sub').textContent = name + ' ga birinchi xabaringizni yozing.';
  document.getElementById('first-message-input').value = '';
  document.getElementById('message-modal').style.display = 'flex';
}

function closeMessageModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('message-modal').style.display = 'none';
  messageTargetUserId = null;
}

async function sendFirstMessage() {
  const message = document.getElementById('first-message-input').value.trim();
  const fromUserId = Number(userId);
  const toUserId = Number(messageTargetUserId);

  if (!message) {
    showToast('Xabar matnini kiriting!');
    return;
  }
  if (!Number.isFinite(fromUserId) || fromUserId <= 0) {
    showToast('Xatolik: sizning foydalanuvchi identifikatoringiz topilmadi.');
    return;
  }
  if (!Number.isFinite(toUserId) || toUserId <= 0) {
    showToast('Xatolik: qabul qiluvchi topilmadi. Iltimos, qayta urinib ko‘ring.');
    return;
  }

  // Xabar limit tekshirish
  const limitOk = await checkLimit('messages');
  if (!limitOk) {
    showLimitExceeded('messages');
    closeMessageModal();
    return;
  }

  closeMessageModal();

  // First send like
  const likeData = await apiPost('/api/likes/send', {
    from_user: fromUserId,
    to_user: toUserId
  });

  if (likeData.success) {
    if (likeData.error === 'limit_exceeded') {
      showLimitExceeded('likes');
      return;
    }

    if (likeData.match && likeData.match_id) {
      await apiPost('/api/chat/send', {
        match_id: likeData.match_id,
        sender_id: fromUserId,
        message: message
      });
      await loadLimitStatus();
      showToast('💬 Xabar yuborildi!');
      openChatRoom(likeData.match_id, messageTargetName, messageTargetPhoto);
      return;
    }

    showToast('💙 Like yuborildi! Agar u ham sizni yoqtirsa, match bo\'lib suhbat ochiladi.');
  } else {
    if (likeData.error === 'limit_exceeded') {
      showLimitExceeded('likes');
    } else {
      showToast('Xatolik: ' + (likeData.error || 'Like yuborilmadi'));
    }
  }
}

// ===== LIMIT CHECK HELPER =====
async function checkLimit(type) {
  if (!userId) return false;
  if (!currentLimitStatus) {
    await loadLimitStatus();
  }
  if (currentLimitStatus && currentLimitStatus.unlimited) return true;

  if (currentLimitStatus) {
    if (type === 'likes' && currentLimitStatus.likes_remaining <= 0) return false;
    if (type === 'messages' && currentLimitStatus.messages_remaining <= 0) return false;
    if (type === 'super_likes' && currentLimitStatus.super_likes_remaining <= 0) return false;
  }
  return true;
}

async function decrementLocalLimit(type) {
  if (!currentLimitStatus || currentLimitStatus.unlimited) return;
  if (type === 'likes') currentLimitStatus.likes_remaining = Math.max(0, currentLimitStatus.likes_remaining - 1);
  if (type === 'messages') currentLimitStatus.messages_remaining = Math.max(0, currentLimitStatus.messages_remaining - 1);
  if (type === 'super_likes') currentLimitStatus.super_likes_remaining = Math.max(0, currentLimitStatus.super_likes_remaining - 1);
  updateLimitBar(currentLimitStatus);
}

// ===== PAGE NAVIGATION =====

function populateProfileForm(profile) {
  if (!profile) return;

  // Set gender
  if (profile.gender) {
    selectGender(profile.gender);
  }

  // Set text inputs
  const nameInput = document.getElementById('inp-name');
  const ageInput = document.getElementById('inp-age');
  const cityInput = document.getElementById('inp-city');
  const aboutInput = document.getElementById('inp-about');

  if (nameInput && profile.full_name) nameInput.value = profile.full_name;
  if (ageInput && profile.age) ageInput.value = profile.age;
  if (cityInput && profile.city) cityInput.value = profile.city;
  if (aboutInput && profile.about) aboutInput.value = profile.about;

  // Set zodiac
  if (profile.zodiac) {
    const zodiacSelect = document.getElementById('sel-zodiac');
    if (zodiacSelect) zodiacSelect.value = profile.zodiac;
    syncZodiacPicker();
  }

  // Set interests chips
  if (profile.interests && Array.isArray(profile.interests)) {
    selectedInterests = [...profile.interests];
    document.querySelectorAll('#interests-chips .chip').forEach(chip => {
      const text = chip.textContent.trim();
      if (selectedInterests.includes(text)) {
        chip.classList.add('selected');
      }
    });
  }

  // Set goals chips
  if (profile.goals && Array.isArray(profile.goals)) {
    selectedGoals = [...profile.goals];
    document.querySelectorAll('#goals-chips .chip').forEach(chip => {
      const text = chip.textContent.trim();
      if (selectedGoals.includes(text)) {
        chip.classList.add('selected');
      }
    });
  }

  // Set photo
  if (profile.photo_base64 || profile.photo_file_id) {
    photoBase64 = profile.photo_base64 || profile.photo_file_id || '';
    photoReady = true;
    photoUploading = false;
    const preview = document.getElementById('photo-preview');
    const uploadIcon = document.getElementById('upload-icon');
    const uploadText = document.getElementById('upload-text');
    const uploadSub = document.getElementById('upload-sub');

    if (preview) {
      preview.src = photoBase64;
      preview.style.display = 'block';
    }
    if (uploadIcon) uploadIcon.style.display = 'none';
    if (uploadText) uploadText.style.display = 'none';
    if (uploadSub) uploadSub.style.display = 'none';
    updatePhotoUploadState('✅ Rasm yuklangan. Anketa saqlash mumkin.', true, false);
  }
}

function resetProfileFormState() {
  // Clear all form state so previous user's data doesn't leak
  selectedGender = '';
  selectedInterests = [];
  selectedGoals = [];
  photoBase64 = '';
  photoReady = false;
  photoUploading = false;

  // Clear form inputs
  const nameInput = document.getElementById('inp-name');
  const ageInput = document.getElementById('inp-age');
  const cityInput = document.getElementById('inp-city');
  const aboutInput = document.getElementById('inp-about');
  const zodiacSelect = document.getElementById('sel-zodiac');

  if (nameInput) nameInput.value = '';
  if (ageInput) ageInput.value = '';
  if (cityInput) cityInput.value = '';
  if (aboutInput) aboutInput.value = '';
  if (zodiacSelect) zodiacSelect.value = '';

  // Clear gender selection visuals
  const maleBtn = document.getElementById('gender-erkak');
  const femaleBtn = document.getElementById('gender-ayol');
  if (maleBtn) maleBtn.classList.remove('selected');
  if (femaleBtn) femaleBtn.classList.remove('selected');

  // Clear chips
  document.querySelectorAll('.chip.selected').forEach(chip => chip.classList.remove('selected'));

  // Clear photo preview
  const preview = document.getElementById('photo-preview');
  const uploadIcon = document.getElementById('upload-icon');
  const uploadText = document.getElementById('upload-text');
  const uploadSub = document.getElementById('upload-sub');

  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
  if (uploadIcon) uploadIcon.style.display = 'inline-flex';
  if (uploadText) uploadText.style.display = 'inline';
  if (uploadSub) uploadSub.style.display = 'inline';

  // Reset upload status
  updatePhotoUploadState('Rasm yuklangandan so\'ng saqlash mumkin.', false, false);
}

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const pageEl = document.getElementById('page-' + name);
  if (pageEl) pageEl.classList.add('active');

  const navBtn = document.getElementById('nav-' + name);
  if (navBtn) navBtn.classList.add('active');

  if (name === 'search') {
    setDefaultSearchGender();
    syncSearchZodiacPicker();
    loadPendingLikesIndicator();
    loadLimitStatus();
  }
  if (name === 'myprofile') loadMyProfile();
  if (name === 'chats') loadChats();
  if (name === 'profile') {
    // CRITICAL: Reset form state when entering profile page
    // so previous user's data doesn't appear
    resetProfileFormState();
    // Then load existing profile if available for CURRENT user
    const existing = getProfile();
    if (existing) {
      populateProfileForm(existing);
    }
  }

  syncZodiacPicker();
}

// ===== ADVANCED FILTERS TOGGLE =====
function toggleAdvancedFilters() {
  const el = document.getElementById('advanced-filters');
  const btnText = document.getElementById('adv-filter-btn-text');
  if (el) {
    const showing = el.style.display !== 'none';
    el.style.display = showing ? 'none' : 'block';
    if (btnText) btnText.textContent = showing ? '🔍 Kengaytirilgan filtrlar' : '❌ Filtrni yopish';
  }
}

// ===== SEARCH =====
function selectGender(g) {
  selectedGender = g;
  document.getElementById('gender-erkak').classList.toggle('selected', g === 'erkak');
  document.getElementById('gender-ayol').classList.toggle('selected', g === 'ayol');
}

function getOppositeGender(g) {
  return g === 'erkak' ? 'ayol' : g === 'ayol' ? 'erkak' : '';
}

function selectSearchGender(g) {
  selectedSearchGender = g;
  document.getElementById('sf-gender-erkak').classList.toggle('selected', g === 'erkak');
  document.getElementById('sf-gender-ayol').classList.toggle('selected', g === 'ayol');
}

function setDefaultSearchGender() {
  const profile = getProfile();
  const opposite = profile ? getOppositeGender(profile.gender) : '';
  if (opposite) selectSearchGender(opposite);
}

// ===== CHIP TOGGLE =====
function toggleChip(el, group) {
  el.classList.toggle('selected');
  const value = el.textContent.trim();

  if (group === 'interests') {
    if (el.classList.contains('selected')) {
      if (selectedInterests.length >= MAX_INTERESTS_ALLOWED) {
        el.classList.remove('selected');
        showToast('Maksimal 5 ta qiziqish tanlash mumkin.');
        return;
      }
      selectedInterests = Array.from(new Set([...selectedInterests, value]));
    } else {
      selectedInterests = selectedInterests.filter(i => i !== value);
    }
  } else if (group === 'goals') {
    if (el.classList.contains('selected')) selectedGoals.push(value);
    else selectedGoals = selectedGoals.filter(i => i !== value);
  } else if (group === 'sf-goals') {
    if (el.classList.contains('selected')) selectedSearchGoals.push(value);
    else selectedSearchGoals = selectedSearchGoals.filter(i => i !== value);
  } else if (group === 'sf-interests') {
    if (el.classList.contains('selected')) selectedSearchInterests.push(value);
    else selectedSearchInterests = selectedSearchInterests.filter(i => i !== value);
  }
}

function toggleZodiacMenu() {
  const menu = document.getElementById('zodiac-options');
  if (!menu) return;
  menu.style.display = menu.style.display === 'none' ? 'grid' : 'none';
}

function syncZodiacPicker() {
  const select = document.getElementById('sel-zodiac');
  const button = document.getElementById('zodiac-picker-toggle');
  if (!select || !button) return;

  const value = select.value?.trim();
  document.querySelectorAll('.zodiac-option').forEach(option => {
    option.classList.toggle('selected', option.dataset.zodiac === value);
  });
  button.classList.toggle('selected', !!value);
  const labelMap = {
    "Qo'y": '♈ Qo\'y',
    'Buzoq': '♉ Buzoq',
    'Egizak': '♊ Egizak',
    'Qisqichbaqa': '♋ Qisqichbaqa',
    'Arslon': '♌ Arslon',
    'Sunbula': '♍ Sunbula',
    'Tarozi': '♎ Tarozi',
    'Chayon': '♏ Chayon',
    'O\'qotar': '♐ O\'qotar',
    'Tog\' echkisi': '♑ Tog\' echkisi',
    'Qovg\'a': '♒ Qovg\'a',
    'Baliq': '♓ Baliq'
  };

  button.textContent = value ? (labelMap[value] || value) : 'Burj tanlang...';
}

function selectZodiac(value, label) {
  const select = document.getElementById('sel-zodiac');
  const button = document.getElementById('zodiac-picker-toggle');
  const menu = document.getElementById('zodiac-options');

  if (select) {
    select.value = value;
  }
  if (button) {
    button.textContent = label || 'Burj tanlang...';
    button.classList.toggle('selected', !!value);
  }
  document.querySelectorAll('.zodiac-option').forEach(option => {
    option.classList.toggle('selected', option.dataset.zodiac === value);
  });
  if (menu) {
    menu.style.display = 'none';
  }
}

function toggleSearchZodiacMenu() {
  const menu = document.getElementById('sf-zodiac-options');
  if (!menu) return;
  menu.style.display = menu.style.display === 'none' ? 'grid' : 'none';
}

function syncSearchZodiacPicker() {
  const select = document.getElementById('sf-zodiac');
  const button = document.getElementById('sf-zodiac-toggle');
  if (!select || !button) return;

  const value = select.value?.trim() || '';
  document.querySelectorAll('#sf-zodiac-options .zodiac-option').forEach(option => {
    option.classList.toggle('selected', option.dataset.zodiac === value);
  });

  const labelMap = {
    '': 'Barcha burjlar',
    "Qo'y": '♈ Qo\'y',
    'Buzoq': '♉ Buzoq',
    'Egizak': '♊ Egizak',
    'Qisqichbaqa': '♋ Qisqichbaqa',
    'Arslon': '♌ Arslon',
    'Sunbula': '♍ Sunbula',
    'Tarozi': '♎ Tarozi',
    'Chayon': '♏ Chayon',
    'O\'qotar': '♐ O\'qotar',
    'Tog\' echkisi': '♑ Tog\' echkisi',
    'Qovg\'a': '♒ Qovg\'a',
    'Baliq': '♓ Baliq'
  };

  button.textContent = labelMap[value] || (value ? value : 'Barcha burjlar');
  button.classList.toggle('selected', !!value);
}

function selectSearchZodiac(value, label) {
  const select = document.getElementById('sf-zodiac');
  const button = document.getElementById('sf-zodiac-toggle');
  const menu = document.getElementById('sf-zodiac-options');

  if (select) select.value = value;
  if (button) {
    button.textContent = label || 'Barcha burjlar';
    button.classList.toggle('selected', !!value);
  }

  document.querySelectorAll('#sf-zodiac-options .zodiac-option').forEach(option => {
    option.classList.toggle('selected', option.dataset.zodiac === value);
  });

  if (menu) menu.style.display = 'none';
}

// ========== BURJ NOMLARI VA MOSLIK MA'LUMOTLARI ==========
const ZODIAC_SIGNS = {
  "qoy": ("Qo'y", "♈"),
  "buzoq": ("Buzoq", "♉"),
  "egizak": ("Egizak", "♊"),
  "qisqichbaqa": ("Qisqichbaqa", "♋"),
  "arslon": ("Arslon", "♌"),
  "sunbula": ("Sunbula", "♍"),
  "tarozi": ("Tarozi", "♎"),
  "chayon": ("Chayon", "♏"),
  "oqotar": ("O'qotar", "♐"),
  "tog_echkisi": ("Tog' echkisi", "♑"),
  "qovga": ("Qovg'a", "♒"),
  "baliq": ("Baliq", "♓"),
};

const ZODIAC_COMPATIBILITY = {
  "qoy": {
    "mos": ["arslon", "egizak", "oqotar"],
    "qiyin": ["qisqichbaqa", "chayon", "baliq"]
  },
  "buzoq": {
    "mos": ["sunbula", "qisqichbaqa", "tog_echkisi"],
    "qiyin": ["egizak", "oqotar", "qovga"]
  },
  "egizak": {
    "mos": ["qoy", "tarozi", "qovga"],
    "qiyin": ["buzoq", "chayon", "tog_echkisi"]
  },
  "qisqichbaqa": {
    "mos": ["buzoq", "baliq", "chayon"],
    "qiyin": ["qoy", "egizak", "oqotar"]
  },
  "arslon": {
    "mos": ["qoy", "egizak", "tarozi"],
    "qiyin": ["buzoq", "tog_echkisi", "baliq"]
  },
  "sunbula": {
    "mos": ["buzoq", "tog_echkisi", "chayon"],
    "qiyin": ["egizak", "arslon", "oqotar"]
  },
  "tarozi": {
    "mos": ["egizak", "arslon", "qovga"],
    "qiyin": ["chayon", "qisqichbaqa", "tog_echkisi"]
  },
  "chayon": {
    "mos": ["qisqichbaqa", "baliq", "buzoq"],
    "qiyin": ["egizak", "qoy", "tarozi"]
  },
  "oqotar": {
    "mos": ["qoy", "arslon", "qovga"],
    "qiyin": ["buzoq", "qisqichbaqa", "tog_echkisi"]
  },
  "tog_echkisi": {
    "mos": ["buzoq", "sunbula", "chayon"],
    "qiyin": ["egizak", "tarozi", "oqotar"]
  },
  "qovga": {
    "mos": ["oqotar", "egizak", "tarozi"],
    "qiyin": ["buzoq", "chayon", "qisqichbaqa"]
  },
  "baliq": {
    "mos": ["buzoq", "qisqichbaqa", "chayon"],
    "qiyin": ["qoy", "egizak", "arslon"]
  }
};

function normalizeZodiacKey(value) {
  if (!value) return null;

  const text = String(value)
    .normalize('NFKC')
    .replace(/[♈♉♊♋♌♍♎♏♐♑♒♓]/g, '')
    .replace(/[’'`]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  const aliases = {
    'qoy': 'qoy', 'qo y': 'qoy', 'aries': 'qoy',
    'buzoq': 'buzoq', 'buqa': 'buzoq', 'taurus': 'buzoq',
    'egizak': 'egizak', 'egizaklar': 'egizak', 'gemini': 'egizak',
    'qisqichbaqa': 'qisqichbaqa', 'cancer': 'qisqichbaqa',
    'arslon': 'arslon', 'sher': 'arslon', 'leo': 'arslon',
    'sunbula': 'sunbula', 'qiz': 'sunbula', 'virgo': 'sunbula',
    'tarozi': 'tarozi', 'libra': 'tarozi',
    'chayon': 'chayon', 'chayonlar': 'chayon', 'scorpio': 'chayon',
    'oqotar': 'oqotar', 'o qotar': 'oqotar', 'yoy': 'oqotar', 'sagittarius': 'oqotar',
    'tog echkisi': 'tog_echkisi', 'tog echkisi': 'tog_echkisi', 'capricorn': 'tog_echkisi',
    'qovga': 'qovga', 'qovg a': 'qovga', 'qovunchi': 'qovga', 'aquarius': 'qovga',
    'baliq': 'baliq', 'pisces': 'baliq'
  };

  return aliases[text] || text.replace(/\s*\([^)]*\)\s*$/, '');
}

// Foydalanuvchining burjini olish
function getMyZodiac() {
  const profile = getProfile();
  if (!profile?.zodiac) return null;

  const key = normalizeZodiacKey(profile.zodiac);
  return ZODIAC_COMPATIBILITY[key] ? key : null;
}

// Burjga mos kelish statusini tekshirish
function getZodiacCompatStatus(myZodiac, theirZodiac) {
  if (!myZodiac || !theirZodiac) return null;

  const myKey = normalizeZodiacKey(myZodiac);
  const theirKey = normalizeZodiacKey(theirZodiac);
  const compat = ZODIAC_COMPATIBILITY[myKey];

  if (!compat || !theirKey) return null;
  if (compat.mos.includes(theirKey)) return 'mos';
  if (compat.qiyin.includes(theirKey)) return 'qiyin';

  return 'neytral';
}
let cocoSsdModel = null;
let cocoSsdLoadPromise = null;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Yuklanmadi: ${src}`));
    document.head.appendChild(script);
  });
}

function waitForGlobal(name, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (typeof window[name] !== 'undefined' && window[name]) {
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        reject(new Error(`${name} kutish vaqti tugadi`));
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}

async function ensureCocoSsdModel() {
  if (cocoSsdModel) return cocoSsdModel;
  if (cocoSsdLoadPromise) return cocoSsdLoadPromise;

  cocoSsdLoadPromise = (async () => {
    if (typeof tf === 'undefined') {
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js');
    }
    if (typeof cocoSsd === 'undefined') {
      await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.2/dist/coco-ssd.min.js');
    }
    await waitForGlobal('cocoSsd', 15000);
    cocoSsdModel = await cocoSsd.load();
    return cocoSsdModel;
  })();

  return cocoSsdLoadPromise;
}

async function detectPersonCocoSsd(file) {
  const model = await ensureCocoSsdModel();
  const url = URL.createObjectURL(file);
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Rasm yuklanmadi'));
    image.src = url;
  });
  try {
    const predictions = await model.detect(img);
    return predictions.some(p => p.class === 'person' && p.score >= 0.25);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function updatePhotoUploadState(message, ready = false, uploading = photoUploading) {
  const status = document.getElementById('upload-status');
  const area = document.getElementById('photo-upload-area');
  const saveBtn = document.getElementById('save-profile-btn');
  if (status) status.textContent = message;
  if (area) {
    area.classList.toggle('photo-ready', ready);
    area.classList.toggle('photo-uploading', uploading);
  }
  if (saveBtn) {
    const canSave = Boolean(photoReady && photoBase64 && !uploading);
    saveBtn.disabled = !canSave;
  }
}

function restoreExistingPhotoState() {
  // CRITICAL: Only restore photo for the CURRENT user, not any cached data
  const existing = getProfile();
  if (existing?.photo_base64 || existing?.photo_file_id) {
    // Verify this profile belongs to current user before restoring
    const currentUserId = userId || getSessionId();
    const profileUserId = existing.telegram_id;
    if (profileUserId && userId && profileUserId !== userId) {
      // Profile belongs to different user — don't restore!
      console.warn('Photo state blocked: profile belongs to different user');
      return;
    }
    photoBase64 = existing.photo_base64 || existing.photo_file_id || '';
    photoReady = true;
    photoUploading = false;
    const preview = document.getElementById('photo-preview');
    if (preview) {
      preview.src = photoBase64;
      preview.style.display = 'block';
    }
    document.getElementById('upload-icon')?.style.setProperty('display', 'none');
    document.getElementById('upload-text')?.style.setProperty('display', 'none');
    document.getElementById('upload-sub')?.style.setProperty('display', 'none');
    updatePhotoUploadState('✅ Rasm yuklangan. Anketa saqlash mumkin.', true, false);
  }
}

function proceedWithPhotoPreview(file) {
  photoUploading = true;
  updatePhotoUploadState('📸 Rasm yuklanmoqda…', false, true);
  const reader = new FileReader();
  reader.onload = (e) => {
    photoBase64 = e.target.result;
    const preview = document.getElementById('photo-preview');
    const uploadText = document.getElementById('upload-text');
    const uploadSub = document.getElementById('upload-sub');
    const uploadIcon = document.getElementById('upload-icon');
    if (preview) {
      preview.src = photoBase64;
      preview.style.display = 'block';
    }
    if (uploadIcon) uploadIcon.style.display = 'none';
    if (uploadText) uploadText.style.display = 'none';
    if (uploadSub) uploadSub.style.display = 'none';
    photoReady = true;
    photoUploading = false;
    updatePhotoUploadState('✅ Rasm yuklandi. Endi anketa saqlashingiz mumkin.', true, false);
  };
  reader.onerror = () => {
    photoReady = false;
    photoUploading = false;
    updatePhotoUploadState('❌ Rasm o‘qilishda xatolik yuz berdi.', false, false);
    showToast('Rasm o‘qilishda xatolik yuz berdi.');
  };
  reader.readAsDataURL(file);
}

// === PHOTO PREVIEW ===
async function previewPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  photoBase64 = '';
  photoReady = false;
  photoUploading = true;
  updatePhotoUploadState('📸 Rasm tekshirilmoqda, iltimos kuting…', false, true);
  if (!file.type.startsWith('image/')) {
    showToast('Faqat rasm fayllari qabul qilinadi.');
    input.value = '';
    photoBase64 = '';
    photoReady = false;
    photoUploading = false;
    updatePhotoUploadState('❌ Faqat rasm fayllari qabul qilinadi.', false, false);
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('Rasm 5MB dan katta!');
    input.value = '';
    photoBase64 = '';
    photoReady = false;
    photoUploading = false;
    updatePhotoUploadState('❌ Rasm 5MB dan katta.', false, false);
    return;
  }

  let faceDetected = false;
  if (window.isSecureContext && 'FaceDetector' in window && typeof FaceDetector === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      const detector = new FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
      const faces = await detector.detect(bitmap);
      faceDetected = faces.length > 0;
    } catch (error) {
      console.warn('FaceDetector xatolik:', error);
    }
  }

  if (faceDetected) {
    updatePhotoUploadState('🧠 Yuz aniqlangan. Rasm yuklanmoqda…', false);
    proceedWithPhotoPreview(file);
    return;
  }

  showToast('Rasm tekshirilmoqda, biroz kuting...', 12000);
  try {
    const personDetected = await detectPersonCocoSsd(file);
    if (personDetected) {
      updatePhotoUploadState('🧍 Rasmda inson borligi tasdiqlandi. Yuklanmoqda…', false);
      proceedWithPhotoPreview(file);
    } else {
      showToast('Rasmda inson topilmadi. Iltimos, o\'zingizni ko\'rsatadigan rasm tanlang.');
      input.value = '';
      photoBase64 = '';
      photoReady = false;
      photoUploading = false;
      updatePhotoUploadState('❌ Rasmda inson topilmadi. Yana urining.', false, false);
    }
  } catch (err) {
    console.error('COCO-SSD tekshiruvi xatolik:', err);
    showToast('Rasm tekshirishda xatolik. Internet aloqasini tekshiring va qayta urinib ko\'ring.');
    input.value = '';
    photoBase64 = '';
    photoReady = false;
    photoUploading = false;
    updatePhotoUploadState('❌ Tekshiruvda xatolik. Internet aloqasini tekshiring.', false, false);
  }
}

// === SAVE PROFILE ===
async function saveProfile() {
  if (!photoReady || !photoBase64) {
    showToast('Avval to\'g\'ri rasm yuklang va tekshirilgan bo\'lsin.');
    return;
  }

  const name = document.getElementById('inp-name').value.trim();
  const age = parseInt(document.getElementById('inp-age').value);
  const city = document.getElementById('inp-city').value.trim();
  const about = document.getElementById('inp-about')?.value?.trim() || '';
  const zodiac = document.getElementById('sel-zodiac').value;

  if (!selectedGender) { showToast('Jinsni tanlang!'); return; }
  if (!name) { showToast('Ismingizni kiriting!'); return; }
  if (!age || age < 16 || age > 80) { showToast('Yoshingizni to\'g\'ri kiriting! (16-80)'); return; }
  if (!city) { showToast('Shahar/tuman kiriting!'); return; }
  if (selectedGoals.length === 0) { showToast('Kamida 1 ta maqsad tanlang!'); return; }

  const trimmedInterests = Array.from(new Set((selectedInterests || []).filter(Boolean))).slice(0, MAX_INTERESTS_ALLOWED);
  if ((selectedInterests || []).length > MAX_INTERESTS_ALLOWED) {
    showToast('Maksimal 5 ta qiziqish tanlash mumkin.');
  }

  const profile = {
    gender: selectedGender,
    full_name: name,
    age: age,
    city: city,
    about: about,
    zodiac: zodiac,
    interests: trimmedInterests,
    goals: selectedGoals,
    photo_base64: photoBase64 || null
  };

  setSavedProfile(profile);

  let serverSaved = false;
  if (userId) {
    serverSaved = await saveProfileToServer(profile, userId);
  }

  if (tg) {
    sendWebAppData({ action: 'save_profile', profile });
  }

  setDefaultSearchGender();
  showToast(serverSaved ? 'Anketa muvaffaqiyatli saqlandi!' : 'Anketa mahalliy saqlandi.');

  document.querySelector('.bottom-nav').style.display = 'flex';
  showPage('search');
}

// === SEARCH ===
function doSearch() {
  tinderUsers = [];
  tinderIndex = 0;
  tinderHistory = [];

  const filters = {};

  // Ism bo'yicha qidirish
  const nameVal = document.getElementById('sf-name')?.value?.trim();
  if (nameVal) filters.name = nameVal;

  // Jins
  if (selectedSearchGender) filters.gender = selectedSearchGender;

  // Kengaytirilgan filtrlar
  const ageFrom = document.getElementById('sf-age-from')?.value?.trim();
  if (ageFrom) filters.age_from = parseInt(ageFrom);
  const ageTo = document.getElementById('sf-age-to')?.value?.trim();
  if (ageTo) filters.age_to = parseInt(ageTo);
  const city = document.getElementById('sf-city')?.value?.trim();
  if (city) filters.city = city;
  if (selectedSearchGoals.length > 0) filters.goals = selectedSearchGoals;
  if (selectedSearchInterests.length > 0) filters.interests = selectedSearchInterests;

  // Burj bo'yicha qidirish
  const zodiacFilterEl = document.getElementById('sf-zodiac');
  if (zodiacFilterEl && zodiacFilterEl.value) {
    filters.zodiac = zodiacFilterEl.value;
  }

  // Burjga mos qidirish
  const zodiacCompatEl = document.getElementById('sf-zodiac-compat');
  if (zodiacCompatEl && zodiacCompatEl.checked) {
    const myZodiac = getMyZodiac();
    if (myZodiac && ZODIAC_COMPATIBILITY[myZodiac]) {
      filters.zodiac_compat_list = ZODIAC_COMPATIBILITY[myZodiac].mos;
    } else {
      // Burj aniqlanmadi - foydalanuvchiga xabar berish va qidirishni to'xtatish
      if (panelBody) {
        panelBody.innerHTML = `<div class="empty-state"><div class="empty-icon">⭐</div><h3>Burjingiz aniqlanmadi</h3><p>"Faqat burjimga mos odamlarni ko'rsat" funksiyasi ishlamasi uchun avval anketangizda burjingizni to'g'ri tanlang.</p><button class="btn-primary" style="margin-top:16px;padding:12px 24px;border-radius:999rem;" onclick="closeSearchResultsModal();showPage('profile')">Anketani to'ldirish</button></div>`;
      }
      if (modal) modal.style.display = 'flex';
      return;
    }
  }

  // Open modal immediately with loading
  const modal = document.getElementById('search-results-modal');
  const panelBody = document.getElementById('search-results-panel-body');
  if (panelBody) panelBody.innerHTML = '<div class="loading"><div class="spinner"></div> Qidirilmoqda...</div>';
  if (modal) modal.style.display = 'flex';

  if (!userId) {
    if (panelBody) panelBody.innerHTML = `<div class="empty-state"><div class="empty-icon"></div><h3>Telegram orqali kiring</h3><p>Qidirish uchun botni Telegram ilovasida oching.</p></div>`;
    return;
  }
  fetchSearchResultsModal(userId, filters);
}

// === TINDER CARD STATE ===
let tinderUsers = [];
let tinderIndex = 0;
let tinderHistory = [];

async function fetchSearchResultsModal(telegramId, filters) {
  const panelBody = document.getElementById('search-results-panel-body');

  tinderUsers = [];
  tinderIndex = 0;
  tinderHistory = [];

  try {
    const data = await apiPost('/api/search', { telegram_id: telegramId || 0, filters });

    if (data.success && data.users && data.users.length > 0) {
      tinderUsers = data.users;
      tinderIndex = 0;
      tinderHistory = [];
      // Render tinder cards inside modal panel - FULL WIDTH
      if (panelBody) {
        panelBody.innerHTML = '<div id="swipe-container-modal" class="swipe-container" style="padding:0;width:100%;"></div>';
        renderTinderCardInModal();
      }
    } else {
      tinderUsers = [];
      tinderIndex = 0;
      tinderHistory = [];
      if (panelBody) {
        panelBody.innerHTML = `<div class="empty-state"><div class="empty-icon">${ICONS.info}</div><h3>Hech kim topilmadi</h3><p>Hozircha sizga mos foydalanuvchilar yo'q. Keyinroq qayta urinib ko'ring.</p></div>`;
      }
    }
  } catch (error) {
    console.error('Search error:', error);
    if (panelBody) {
      panelBody.innerHTML = `<div class="empty-state"><div class="empty-icon">${ICONS.alert}</div><h3>Server bilan aloqa yo'q</h3><p>Internet aloqasini tekshiring yoki keyinroq urinib ko'ring.</p><button class="btn-primary" style="margin-top:16px;padding:12px 24px;border-radius:999rem;" onclick="closeSearchResultsModal();setTimeout(doSearch,300)">🔄 Qayta urinish</button></div>`;
    }
    showToast('Server bilan aloqa yo\'q');
  }
}

function renderTinderCardInModal(direction) {
  const container = document.getElementById('swipe-container-modal');
  if (!container) { renderTinderCard(direction); return; }

  if (tinderIndex >= tinderUsers.length) {
    container.innerHTML = `
      <div class="no-more-wrap">
        <div class="no-more-emoji">✨</div>
        <div class="no-more-title">Hammasi ko'rildi!</div>
        <div class="no-more-sub">Siz barcha nomzodlarni ko'rib chiqdingiz.<br>Qayta qidiring.</div>
        <button class="no-more-btn" onclick="closeSearchResultsModal();doSearch()">🔍 Qayta qidirish</button>
      </div>`;
    return;
  }

  const u = tinderUsers[tinderIndex];
  const total = tinderUsers.length;
  const photo = u.photo_base64 || u.photo_file_id;
  const locationLabel = formatLocationLabel(u.city);
  const myZodiac = getMyZodiac();
  const compatStatus = u.zodiac ? getZodiacCompatStatus(myZodiac, u.zodiac) : null;
  const compatBadge = compatStatus === 'mos'
    ? `<span style="background:#27ae60;color:#fff;border-radius:12px;padding:2px 10px;font-size:12px;font-weight:600;margin-left:6px;">💚 Mos burj</span>`
    : compatStatus === 'qiyin'
    ? `<span style="background:#e74c3c;color:#fff;border-radius:12px;padding:2px 10px;font-size:12px;font-weight:600;margin-left:6px;">⚡ Murakkab</span>`
    : '';

  const animClass = direction === 'left' ? 'animate-left' : direction === 'right' ? 'animate-right' : direction === 'up' ? 'animate-up' : 'animate-in';

  container.innerHTML = `
    <div class="swipe-counter">
      <div class="swipe-dots">${tinderUsers.map((_,i)=>`<div class="swipe-dot${i===tinderIndex?' active':''}"></div>`).join('')}</div>
      <span>${tinderIndex+1} / ${total}</span>
    </div>
    <div class="tinder-card ${animClass}" id="tinder-card-el" style="height:calc(100vh - 80px);">
      <div class="stamp like">❤️ LIKE</div>
      <div class="stamp nope">✕ NOPE</div>
      <div class="stamp superlike">⭐ SUPER</div>
      <div class="tinder-photo">
        ${photo ? `<img src="${photo}" alt="${u.full_name}" onclick="openPhotoViewer('${escapeJs(photo)}','${escapeJs(u.full_name)}')" />` : `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:100px;">${u.gender==='erkak'?'👨':'👩'}</div>`}
        <div class="tinder-photo-gradient"></div>
        <div class="tinder-photo-info">
          <div class="tinder-photo-name">${u.full_name}, ${u.age}</div>
          <div class="tinder-photo-meta">📍 ${locationLabel}${u.zodiac ? ' • ' + u.zodiac : ''}${compatBadge}</div>
        </div>
      </div>
      <div class="tinder-actions">
        <button class="tinder-btn tinder-btn-back" onclick="tinderBackModal()" title="Orqaga">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M3 12l6-6M3 12l6 6"/></svg>
        </button>
        <button class="tinder-btn tinder-btn-nope" onclick="tinderSwipeModal('left')" title="O'tkazib yuborish">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <button class="tinder-btn tinder-btn-superlike" onclick="tinderSuperLikeModal()" title="Super Like">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </button>
        <button class="tinder-btn tinder-btn-like" onclick="tinderSwipeModal('right')" title="Like">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        <button class="tinder-btn tinder-btn-msg" onclick="openMessageModalFromTinder(${u.telegram_id},'${escapeJs(u.full_name)}')" title="Xabar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
      </div>
    </div>`;

  const tinderCardEl = document.getElementById('tinder-card-el');
  setupTinderDragOnModal(tinderCardEl);
  if (tinderCardEl) {
    tinderCardEl.addEventListener('click', function(e) {
      if (e.target.closest('.tinder-actions')) return;
      showProfileDetail(u);
    });
  }
}

function tinderSwipeModal(direction) {
  const card = document.getElementById('tinder-card-el');
  const u = tinderUsers[tinderIndex];
  if (direction === 'right') sendLike(u.telegram_id);
  tinderHistory.push(tinderIndex);
  tinderIndex++;
  if (card) {
    card.classList.add(direction === 'right' ? 'animate-right' : 'animate-left');
    setTimeout(() => renderTinderCardInModal(), 380);
  } else {
    renderTinderCardInModal();
  }
}

function tinderSuperLikeModal() {
  const u = tinderUsers[tinderIndex];
  const btn = document.querySelector('.tinder-btn-superlike');
  if (btn) { btn.classList.add('flash'); setTimeout(()=>btn.classList.remove('flash'),600); }
  openStickerModal(u.telegram_id);
}

function tinderBackModal() {
  if (tinderHistory.length === 0) { showToast('Orqaga qaytish imkoni yo\'q'); return; }
  tinderIndex = tinderHistory.pop();
  renderTinderCardInModal();
}

function openMessageModalFromTinder(targetId, name) {
  openMessageModal(targetId, name);
}

function setupTinderDragOnModal(card) {
  if (!card) return;
  let startX = 0, startY = 0, dx = 0;
  const onStart = (e) => {
    startX = (e.touches ? e.touches[0].clientX : e.clientX);
    startY = (e.touches ? e.touches[0].clientY : e.clientY);
    card.style.transition = 'none';
  };
  const onMove = (e) => {
    dx = (e.touches ? e.touches[0].clientX : e.clientX) - startX;
    const dy = (e.touches ? e.touches[0].clientY : e.clientY) - startY;
    const rotate = dx * 0.05;
    card.style.transform = `translateX(${dx}px) translateY(${dy*0.3}px) rotate(${rotate}deg)`;
    const likeStamp = card.querySelector('.stamp.like');
    const nopeStamp = card.querySelector('.stamp.nope');
    if (likeStamp) likeStamp.style.opacity = dx > 30 ? Math.min((dx-30)/60,1) : '0';
    if (nopeStamp) nopeStamp.style.opacity = dx < -30 ? Math.min((-dx-30)/60,1) : '0';
  };
  const onEnd = () => {
    card.style.transition = '';
    card.style.transform = '';
    const likeStamp = card.querySelector('.stamp.like');
    const nopeStamp = card.querySelector('.stamp.nope');
    if (likeStamp) likeStamp.style.opacity = '0';
    if (nopeStamp) nopeStamp.style.opacity = '0';
    if (dx > 80) tinderSwipeModal('right');
    else if (dx < -80) tinderSwipeModal('left');
    dx = 0;
  };
  card.addEventListener('touchstart', onStart, {passive:true});
  card.addEventListener('touchmove', onMove, {passive:true});
  card.addEventListener('touchend', onEnd);
  card.addEventListener('mousedown', onStart);
  card.addEventListener('mousemove', (e) => { if (e.buttons) onMove(e); });
  card.addEventListener('mouseup', onEnd);
}

async function fetchSearchResults(telegramId, filters) {
  const swipeContainer = document.getElementById('swipe-container');
  const resultsEl = document.getElementById('search-results');

  tinderUsers = [];
  tinderIndex = 0;
  tinderHistory = [];

  if (swipeContainer) {
    swipeContainer.innerHTML = '<div class="loading"><div class="spinner"></div> Qidirilmoqda...</div>';
  }

  try {
    const data = await apiPost('/api/search', { telegram_id: telegramId || 0, filters });

    if (data.success && data.users && data.users.length > 0) {
      tinderUsers = data.users;
      tinderIndex = 0;
      tinderHistory = [];
      if (resultsEl) resultsEl.style.display = 'block';
      renderTinderCard();
    } else {
      tinderUsers = [];
      tinderIndex = 0;
      tinderHistory = [];
      if (swipeContainer) {
        swipeContainer.innerHTML = `<div class="empty-state"><div class="empty-icon">${ICONS.info}</div><h3>Hech kim topilmadi</h3><p>Hozircha sizga mos foydalanuvchilar yo'q. Keyinroq qayta urinib ko'ring.</p></div>`;
      }
      if (resultsEl) resultsEl.style.display = 'block';
    }
  } catch (error) {
    showToast('Server bilan aloqa yo\'q');
    if (swipeContainer) {
      swipeContainer.innerHTML = `<div class="empty-state"><div class="empty-icon">${ICONS.alert}</div><h3>Ulana olmadi</h3><p>Internet aloqasini tekshiring.</p></div>`;
    }
    if (resultsEl) resultsEl.style.display = 'block';
  }
}

function renderTinderCard(direction) {
  const container = document.getElementById('swipe-container');
  if (!container) return;

  if (tinderIndex >= tinderUsers.length) {
    container.innerHTML = `
      <div class="no-more-wrap">
        <div class="no-more-emoji">✨</div>
        <div class="no-more-title">Hammasi ko'rildi!</div>
        <div class="no-more-sub">Siz barcha nomzodlarni ko'rib chiqdingiz.<br>Qayta qidiring.</div>
        <button class="no-more-btn" onclick="doSearch()">🔍 Qayta qidirish</button>
      </div>`;
    return;
  }

  const u = tinderUsers[tinderIndex];
  const total = tinderUsers.length;
  const icon = u.gender === 'erkak' ? ICONS.male : ICONS.female;
  const photo = u.photo || u.photo_file_id || u.photo_base64;
  const locationLabel = formatLocationLabel(u.city);

  const photoHtml = photo
    ? `<img src="${photo}" alt="${u.full_name}" loading="lazy" />`
    : `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:var(--ios-blue);opacity:0.4;">${icon}</div>`;

  const dots = Array.from({length: Math.min(total, 7)}, (_, i) => {
    const ci = Math.min(tinderIndex, 6);
    return `<div class="swipe-dot ${i === ci ? 'active' : ''}"></div>`;
  }).join('');

  const goals = (u.goals || []).map(g => `<span class="tinder-tag">${g}</span>`).join('');
  const interests = (u.interests || []).map(i => `<span class="tinder-tag tinder-tag-alt">${i}</span>`).join('');

  container.innerHTML = `
    <div class="swipe-counter">
      <div class="swipe-dots">${dots}</div>
      <span style="margin-left:6px;">${tinderIndex+1} / ${total}</span>
    </div>
    <div class="tinder-card animate-in" id="tinder-card" data-user="${escapeHtmlAttr(JSON.stringify(u))}" style="height:calc(100vh - 80px);">
      <span class="stamp like" id="stamp-like">LIKE 💚</span>
      <span class="stamp nope" id="stamp-nope">NOPE ✗</span>
      <span class="stamp superlike" id="stamp-super">SUPER ⭐</span>
      <div class="tinder-photo">
        ${photoHtml}
        <div class="tinder-photo-gradient"></div>
        <div class="tinder-photo-info">
          <div class="tinder-photo-name">${u.full_name}, ${u.age}</div>
          <div class="tinder-photo-meta">📍 ${locationLabel}${u.zodiac ? ' &nbsp;•&nbsp; ' + u.zodiac : ''}</div>
        </div>
      </div>
      <div class="tinder-body">
        <div class="tinder-tags-wrap">${goals}${interests}</div>
      </div>
      <div class="tinder-actions" onclick="event.stopPropagation()">
        <button class="tinder-btn tinder-btn-back" onclick="tinderBack()" title="Orqaga">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M3 12l6-6M3 12l6 6"/></svg>
        </button>
        <button class="tinder-btn tinder-btn-nope" onclick="tinderDislike()" title="Yoqmadi">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <button class="tinder-btn tinder-btn-superlike" id="superlike-btn" onclick="openStickerModal(${u.telegram_id})" title="Super Like">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </button>
        <button class="tinder-btn tinder-btn-like" onclick="tinderLike()" title="Like">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        <button class="tinder-btn tinder-btn-msg" onclick="event.stopPropagation(); openMessageModal(${u.telegram_id},'${escapeJs(u.full_name)}','${escapeJs(photo||'')}', ${u.can_write});" title="Xabar yuborish">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
      </div>
    </div>`;

  // Tinder card click - data attribute orqali showProfileDetail
  const tinderCard = document.getElementById('tinder-card');
  if (tinderCard) {
    tinderCard.addEventListener('click', function(e) {
      if (e.target.closest('.tinder-actions')) return;
      try {
        const raw = this.dataset.user
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');
        showProfileDetail(JSON.parse(raw));
      } catch(err) {
        showProfileDetail(tinderUsers[tinderIndex]);
      }
    });
  }
}

function showStamp(type) {
  const el = document.getElementById('stamp-' + type);
  if (!el) return;
  el.style.opacity = '1';
  setTimeout(() => { if(el) el.style.opacity = '0'; }, 600);
}

async function tinderLike() {
  const u = tinderUsers[tinderIndex];
  if (!u) return;

  // Limit tekshirish
  const limitOk = await checkLimit('likes');
  if (!limitOk) {
    showLimitExceeded('likes');
    return;
  }

  showStamp('like');
  const card = document.getElementById('tinder-card');
  if (card) card.classList.add('animate-right');
  sendLike(u.telegram_id);
  tinderHistory.push(tinderIndex);
  setTimeout(() => { tinderIndex++; renderTinderCard('right'); }, 380);
}

function tinderDislike() {
  const u = tinderUsers[tinderIndex];
  if (!u) return;
  showStamp('nope');
  const card = document.getElementById('tinder-card');
  if (card) card.classList.add('animate-left');
  tinderHistory.push(tinderIndex);
  setTimeout(() => { tinderIndex++; renderTinderCard('left'); }, 380);
}

function tinderBack() {
  if (!tinderHistory.length) { showToast('Orqaga qaytish mumkin emas'); return; }
  tinderIndex = tinderHistory.pop();
  renderTinderCard();
  showToast('⬅️ Oldingi nomzod');
}

// === STICKERS ===
const STICKERS = ['😇','😅','😳','😎','🤔','👋','🥰','❤️','😍','🤫','😜','🫣','👍','👏','😡','🫦','🔥','💔','🌹','😉'];
let stickerTargetId = null;

async function openStickerModal(toUserId) {
  if (!userId) {
    showToast('Foydalanuvchi ID topilmadi');
    return;
  }

  // Super Like limit tekshirish
  const limitOk = await checkLimit('super_likes');
  if (!limitOk) {
    showLimitExceeded('super_likes');
    return;
  }

  stickerTargetId = toUserId;
  const grid = document.getElementById('sticker-grid');
  grid.innerHTML = STICKERS.map(s =>
    `<button class="sticker-btn" onclick="sendSticker('${s}')">${s}</button>`
  ).join('');
  document.getElementById('sticker-overlay').style.display = 'flex';
  const btn = document.getElementById('superlike-btn');
  if (btn) { btn.classList.add('flash'); setTimeout(()=>btn.classList.remove('flash'),500); }
}

function closeStickerModal(e) {
  if (e && e.target !== document.getElementById('sticker-overlay')) return;
  document.getElementById('sticker-overlay').style.display = 'none';
  stickerTargetId = null;
}

async function sendSticker(sticker) {
  document.getElementById('sticker-overlay').style.display = 'none';
  if (!stickerTargetId || !userId) { showToast('Xatolik'); return; }

  showStamp('super');
  const card = document.getElementById('tinder-card');
  if (card) card.classList.add('animate-up');

  const likeData = await apiPost('/api/likes/send', {
    from_user: userId,
    to_user: stickerTargetId,
    super_like: true,
    sticker: sticker
  });

  if (likeData.error === 'limit_exceeded') {
    showLimitExceeded('super_likes');
    return;
  }

  if (likeData.match && likeData.match_id) {
    await apiPost('/api/chat/send', {
      match_id: likeData.match_id,
      sender_id: userId,
      message: `${sticker} ⭐ Super Like!`
    });
    showToast('🎉 Match! ' + sticker + ' Super Like yuborildi!');
  } else {
    showToast('⭐ ' + sticker + ' Super Like yuborildi!');
  }

  const renderNextCard = document.getElementById('swipe-container-modal')
    ? renderTinderCardInModal
    : renderTinderCard;

  tinderHistory.push(tinderIndex);
  setTimeout(() => {
    tinderIndex++;
    renderNextCard();
  }, 380);
  stickerTargetId = null;
}

async function loadPendingLikesIndicator() {
  const badge = document.getElementById('search-likes-badge');
  if (!badge || !userId) {
    if (badge) badge.style.display = 'none';
    return;
  }
  const data = await apiPost('/api/likes/received', { telegram_id: userId });
  const count = data.success ? (data.likes || []).length : 0;
  if (count > 0) {
    badge.textContent = count > 9 ? '9+' : count;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

async function openIncomingLikesModal() {
  const modal = document.getElementById('likes-modal');
  const body = document.getElementById('likes-modal-body');
  if (!modal || !body) return;
  modal.style.display = 'flex';
  if (!userId) {
    body.innerHTML = `<div class="empty-state"><div class="empty-icon">${ICONS.alert}</div><h3>Foydalanuvchi aniqlanmadi</h3><p>Telegram ID topilmadi. Web Appni Telegram ichida oching yoki qayta kirib ko'ring.</p></div>`;
    return;
  }
  body.innerHTML = '<div class="loading"><div class="spinner"></div> Yuklanmoqda...</div>';

  const data = await apiPost('/api/likes/received', { telegram_id: userId });
  if (!data.success) {
    body.innerHTML = `<div class="empty-state"><div class="empty-icon">${ICONS.alert}</div><h3>Xatolik yuz berdi</h3><p>Qayta urinib ko'ring.</p></div>`;
    return;
  }

  const likes = data.likes || [];
  if (!likes.length) {
    body.innerHTML = `<div class="empty-state"><div class="empty-icon">${ICONS.info}</div><h3>Hozircha like yo'q</h3><p>Sizga hali hech kim like yubormagan.</p></div>`;
    return;
  }

  body.innerHTML = `
    <div class="section-title" style="margin-top:0;">Sizga like yuborganlar</div>
    <div class="likes-modal-body">
      ${likes.map(u => {
        const photo = u.photo_base64 || u.photo_file_id || '';
        return `
          <div class="like-notification-card" data-user="${escapeHtmlAttr(JSON.stringify(u))}">
            <div class="like-notification-photo">
              ${photo ? `<img src="${photo}" alt="${escapeJs(u.full_name)}" />` : `${u.gender === 'erkak' ? ICONS.male : ICONS.female}`}
            </div>
            <div class="like-notification-info">
              <div>
                <strong>${u.full_name}</strong>
                <div class="like-notification-meta">${u.age} yosh • ${u.city}</div>
              </div>
              <div class="like-notification-actions">
                <button class="like-btn" onclick="event.stopPropagation(); acceptLike(${u.telegram_id}, '${escapeJs(u.full_name)}', '${escapeJs(photo)}'); closeLikesModal();">Qabul</button>
                <button class="reject-btn" onclick="event.stopPropagation(); rejectLike(${u.telegram_id}, '${escapeJs(u.full_name)}');">Rad etish</button>
              </div>
            </div>
          </div>`;
      }).join('')}
    </div>`;

  // Like kartochkalariga click event
  body.querySelectorAll('.like-notification-card').forEach(card => {
    card.addEventListener('click', function() {
      try {
        const raw = this.dataset.user
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        showProfileDetail(JSON.parse(raw));
        closeLikesModal();
      } catch(e) {}
    });
  });
}

function closeLikesModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('likes-modal').style.display = 'none';
}

async function rejectLike(fromUserId, name) {
  if (!userId) return;
  const data = await apiPost('/api/likes/reject', { telegram_id: userId, from_user: fromUserId });
  if (data.success) {
    showToast(`Siz ${name} ni rad qildingiz.`);
    loadPendingLikesIndicator();
    openIncomingLikesModal();
  } else {
    showToast('Xatolik yuz berdi. Iltimos qayta urinib ko\'ring.');
  }
}

function renderProfileCard(u) {
  const icon = u.gender === 'erkak' ? ICONS.male : ICONS.female;
  const goals = (u.goals || []).map(g => `<span class="tag">${g}</span>`).join('');
  const interests = (u.interests || []).slice(0, MAX_INTERESTS_ALLOWED).map(i => `<span class="tag" style="background:var(--accent-soft);color:var(--accent);">${i}</span>`).join('');
  const photo = u.photo || u.photo_file_id || u.photo_base64;
  const photoHtml = photo
    ? `<img src="${photo}" alt="${u.full_name}" loading="lazy" />`
    : `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:var(--primary);">${icon}</div>`;
  const locationLabel = formatLocationLabel(u.city || '');

  return `
  <div class="profile-card" data-user="${escapeHtmlAttr(JSON.stringify(u))}">
    <div class="profile-photo">${photoHtml}</div>
    <div class="profile-info">
      <div class="profile-name"><span style="display:inline-flex;vertical-align:middle;margin-right:6px;">${icon}</span> ${u.full_name}</div>
      <div class="profile-age-city">Yosh: ${u.age} &nbsp;•&nbsp; ${locationLabel || 'Shahar ko\'rsatilmagan'}${u.zodiac ? ' • ' + u.zodiac : ''}</div>
      ${u.about ? `<div class="profile-bio" style="margin-top:6px;color:var(--text-secondary);font-size:13px;line-height:1.4;">${escapeHtml(u.about)}</div>` : ''}
      <div class="profile-tags" style="margin-top:8px;">${goals}${interests}</div>
    </div>
    <div class="profile-actions">
      <button class="action-btn btn-like" onclick="event.stopPropagation(); sendLike(${u.telegram_id})">
        <span class="btn-icon">${ICONS.heart}</span> Like
      </button>
      <button class="action-btn btn-write" onclick="event.stopPropagation(); openMessageModal(${u.telegram_id}, '${escapeJs(u.full_name)}', '${escapeJs(photo || '')}')">
        <span class="btn-icon">${ICONS.message}</span> Xabar
      </button>
      <button class="action-btn btn-block" onclick="event.stopPropagation(); sendBlock(${u.telegram_id})">
        <span class="btn-icon">${ICONS.ban}</span> Blok
      </button>
    </div>
  </div>`;
}

async function acceptLike(fromUserId, name, photo) {
  if (!userId) return;
  const data = await apiPost('/api/likes/accept', { telegram_id: userId, from_user: fromUserId });
  if (data.success) {
    showToast(`${name} bilan match bo'ldingiz!`);
    loadPendingLikesIndicator();
    loadChats();
  } else {
    showToast('Xatolik yuz berdi.');
  }
}

async function sendLike(toUserId) {
  const fromUserId = Number(userId);
  const toUser = Number(toUserId);

  if (!Number.isFinite(fromUserId) || fromUserId <= 0) {
    showToast('Avval profilingizni to\'ldiring');
    return;
  }
  if (!Number.isFinite(toUser) || toUser <= 0) {
    showToast('Xatolik: qabul qiluvchi topilmadi.');
    return;
  }

  // Limit tekshirish
  const limitOk = await checkLimit('likes');
  if (!limitOk) {
    showLimitExceeded('likes');
    return;
  }

  const data = await apiPost('/api/likes/send', { from_user: fromUserId, to_user: toUser });

  if (data.error === 'limit_exceeded') {
    showLimitExceeded('likes');
    return;
  }

  if (data.success) {
    await loadLimitStatus();
    if (data.match) {
      showMatchOverlay();
      loadChats();
    } else {
      showToast('💙 Like yuborildi!');
    }
  } else {
    showToast('Xatolik: ' + (data.error || 'Noma\'lum'));
  }
}

async function sendBlock(blockedId) {
  if (!userId) return;
  await apiPost('/api/block', { blocker: userId, blocked: blockedId });
  showToast('🚫 Bloklandi');
}

function showMatchOverlay() {
  document.getElementById('match-overlay').style.display = 'flex';
}
function closeMatchOverlay() {
  document.getElementById('match-overlay').style.display = 'none';
}

function showProfileDetail(u, showTags = true) {
  const modal = document.getElementById('profile-modal');
  const body = document.getElementById('profile-modal-body');
  if (!modal || !body) return;

  // Chat suhbatdoshi uchun minimal toza dizayn
  if (!showTags) {
    const photo = u.photo || u.photo_file_id || u.photo_base64;
    const region = getCityRegion(u.city || '');

    body.innerHTML = `
      <article class="profile-detail-minimal">
        ${photo ? `<div class="minimal-photo-wrap"><img src="${photo}" alt="${u.full_name}" onclick="openPhotoViewer('${escapeJs(photo)}', '${escapeJs(u.full_name)}')" /></div>` : ''}
        <div class="minimal-info">
          <h2 class="minimal-name">${u.full_name}</h2>
          <div class="minimal-badge">${u.age} yosh • ${u.gender === 'erkak' ? 'Erkak' : 'Ayol'}</div>
          ${u.city ? `
          <div class="minimal-location">
            <div class="minimal-loc-card">
              <div class="minimal-loc-icon">📍</div>
              <div class="minimal-loc-text">
                <div class="minimal-loc-city">${u.city}</div>
                ${region ? `<div class="minimal-loc-region">${region}</div>` : ''}
              </div>
            </div>
          </div>` : ''}
        </div>
      </article>
    `;
    modal.style.display = 'flex';
    return;
  }

  // Asosiy profil ko'rinishi (qidiruv natijalaridan ochilganda)
  const icon = u.gender === 'erkak' ? ICONS.male : ICONS.female;
  const photo = u.photo || u.photo_file_id || u.photo_base64;
  const locationLabel = formatLocationLabel(u.city || '');
  const profileLocation = locationLabel || (u.city || 'Joy ko\'rsatilmagan');
  const goals = (u.goals || []).map(g => `<span class="tag">${g}</span>`).join('');
  const visibleInterests = (u.interests || []).slice(0, MAX_INTERESTS_ALLOWED);
  const interests = visibleInterests.map(i => `<span class="tag" style="background:rgba(0,122,255,0.10);color:var(--ios-blue);">${i}</span>`).join('');
  const aboutText = (u.about || '').trim() || 'Bu foydalanuvchi o\'z maqsadi va qiziqishlarini ko\'rsatib ketgan.';
  const photoHtml = photo
    ? `<div class="profile-detail-photo-wrap"><img src="${photo}" alt="${u.full_name}" onclick="openPhotoViewer('${escapeJs(photo)}','${escapeJs(u.full_name)}')" /></div>`
    : '';

  body.innerHTML = `
    <article class="profile-detail-shell">
      ${photoHtml}
      <section class="profile-detail-card">
        <div class="profile-detail-badge">${u.gender === 'erkak' ? 'Erkak' : 'Ayol'} • ${u.age} yosh</div>
        <div class="profile-detail-title">${icon} ${u.full_name}</div>
        <div class="profile-detail-meta">📍 ${profileLocation}${u.zodiac ? ' • ' + u.zodiac : ''}</div>
        <div class="profile-detail-section">
          <div class="profile-detail-label">Men haqimda</div>
          <p class="profile-detail-summary">${escapeHtml(aboutText)}</p>
        </div>
        ${showTags ? `<div class="profile-detail-section"><div class="profile-detail-label">Maqsadlar</div><div class="chip-row">${goals || '<span class="muted-chip">Ko\'rsatilmagan</span>'}</div></div>` : ''}
        ${showTags ? `<div class="profile-detail-section"><div class="profile-detail-label">Qiziqishlar</div><div class="chip-row">${interests || '<span class="muted-chip">Ko\'rsatilmagan</span>'}</div><div class="muted-chip" style="margin-top:6px;">Maksimal 5 ta qiziqish ko\'rsatiladi.</div></div>` : ''}
      </section>
      <div class="profile-action-grid">
        <button class="action-btn btn-like" onclick="sendLike(${u.telegram_id}); closeProfileModal();">
          <span class="btn-icon">${ICONS.heart}</span>
          <span>Like</span>
        </button>
        <button class="action-btn btn-write" onclick="openMessageModal(${u.telegram_id}, '${escapeJs(u.full_name)}', '${escapeJs(photo || '')}'); closeProfileModal();">
          <span class="btn-icon">${ICONS.message}</span>
          <span>Xabar</span>
        </button>
      </div>
    </article>
  `;
  modal.style.display = 'flex';
}

function openPhotoViewer(src, caption = 'Rasm') {
  const modal = document.getElementById('photo-viewer-modal');
  const img = document.getElementById('photo-viewer-img');
  const label = document.getElementById('photo-viewer-caption');
  if (!modal || !img) return;

  img.src = src || '';
  if (label) label.textContent = caption || 'Rasm';
  modal.style.display = 'flex';
}

function closeProfileModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('profile-modal').style.display = 'none';
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escapeHtmlAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeJs(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"');
}

function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.display = 'block';
  toast.style.animation = 'none';
  toast.offsetHeight;
  toast.style.animation = '';
  setTimeout(() => { toast.style.display = 'none'; }, duration);
}

function getCityRegion(city = '') {
  const value = String(city || '').toLowerCase().trim();
  if (value === 'toshkent shahri' || value === 'toshkent city') {
    return '';
  }
  const rules = [
    { region: 'Andijon viloyati', terms: ['andijon', 'xonobod', 'asaka', 'qorasuv', 'baliqchi', 'buloqboshi', 'izboskan', 'jalaquduq', 'marhamat', 'oltinkoʻl', 'paxtaobod', 'shahrixon', 'ulugʻnor', 'xoʻjaobod', 'qoʻrgʻontepa'] },
    { region: 'Buxoro viloyati', terms: ['buxoro', 'kogon', 'olot', 'vobkent', 'gijduvon', 'romitan', 'shofirkon', 'galaosiyo', 'gazli'] },
    { region: 'Fargʻona viloyati', terms: ['fargʻona', 'fargona', 'qoʻqon', 'qoqon', 'margʻilon', 'margilon', 'quvasoy', 'quva', 'rishton', 'yaypan', 'tinchlik', 'oltiariq', 'furqat', 'bogʻdod', 'beshariq', 'dangʻara', 'soʻx', 'toshloq', 'uchkoʻprik'] },
    { region: 'Jizzax viloyati', terms: ['jizzax', 'dashtobod', 'arnasoy', 'baxmal', 'doʻstlik', 'forish', 'gallaorol', 'mirzachoʻl', 'paxtakor', 'yangiobod', 'zomin', 'zafarobod', 'zarbdor'] },
    { region: 'Xorazm viloyati', terms: ['xorazm', 'urganch', 'xiva', 'pitnak', 'gurlan', 'shovot', 'bogʻot', 'yangiariq', 'tuproqqalʼa', 'hazorasp', 'yangibozor', 'xonqa'] },
    { region: 'Namangan viloyati', terms: ['namangan', 'chust', 'chartaq', 'kosonsoy', 'uchqoʻrgʻon', 'haqqulobod', 'toʻraqoʻrgʻon', 'pop', 'mingbuloq', 'norin', 'uychi', 'yangiqoʻrgʻon'] },
    { region: 'Navoiy viloyati', terms: ['navoiy', 'zarafshon', 'uchquduq', 'nurota', 'qiziltepa', 'goʻzgon', 'gozgon', 'karmana', 'konimex', 'navbahor', 'tomdi', 'xatirchi'] },
    { region: 'Qashqadaryo viloyati', terms: ['qarshi', 'shahrisabz', 'kitob', 'koson', 'muborak', 'yakkabogʻ', 'gʻuzor', 'guzor', 'kamashi', 'chiroqchi', 'dehqonobod', 'mirishkor', 'kasbi', 'nishon'] },
    { region: 'Samarqand viloyati', terms: ['samarqand', 'kattaqoʻrgʻon', 'kattaqorgon', 'urgut', 'oqtosh', 'bulungʻur', 'jomboy', 'chelak', 'nurobod', 'qoshrabot', 'narpay', 'paxtachi', 'payariq', 'pastdargʻom', 'toyloq'] },
    { region: 'Sirdaryo viloyati', terms: ['guliston', 'shirin', 'yangiyer', 'baxt', 'sirdaryo', 'boyovut', 'hovos', 'mirzaobod', 'oqoltin', 'sardoba', 'sayxunobod'] },
    { region: 'Surxondaryo viloyati', terms: ['termiz', 'denov', 'boysun', 'jarqoʻrgʻon', 'qumqoʻrgʻon', 'shargʻun', 'sherobod', 'shoʻrchi', 'angor', 'muzrabot', 'oltinsoy', 'sariosiyo', 'uzun', 'bandixon'] },
    { region: 'Toshkent viloyati', terms: ['toshkent', 'nurafshon', 'angren', 'olmaliq', 'chirchiq', 'ohangaron', 'bekobod', 'yangiyoʻl', 'gazalkent', 'keles', 'piskent', 'chinoz', 'boka', 'oqqoʻrgʻon', 'parkent', 'quyi chirchiq', 'oʻrta chirchiq', 'yuqori chirchiq', 'zangiota'] },
    { region: 'Qoraqalpogʻiston Respublikasi', terms: ['nukus', 'beruniy', 'boʻston', 'mangʻit', 'moʻynoq', 'taxiatosh', 'toʻrtkoʻl', 'xalqobod', 'chimboy', 'shumanay', 'xoʻjayli', 'qoʻngʻirot', 'amudaryo', 'kegeyli', 'qonlikoʻl', 'qorauzyak', 'taxtakoʻpir', 'boʻzatov'] },
  ];

  for (const item of rules) {
    if (item.terms.some(term => value.includes(term))) return item.region;
  }
  return '';
}

function formatLocationLabel(city = '') {
  const region = getCityRegion(city);
  return region ? `${city} • ${region}` : city;
}

// ===== PROFILE HELPERS =====
function isRegistered() {
  return !!getProfile();
}

function getProfile() {
  // ALWAYS read from storage — never use a global cache that could leak between users
  const storageKey = getProfileStorageKey();
  const data = localStorage.getItem(storageKey);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.warn('Profile cache parse failed', e);
    }
  }

  // Legacy fallback for older browsers/devices.
  const legacyData = localStorage.getItem('dating_profile');
  if (legacyData) {
    try {
      const parsed = JSON.parse(legacyData);
      return parsed;
    } catch (e) {
      console.warn('Legacy profile cache parse failed', e);
    }
  }

  return null;
}

function setSavedProfile(profile) {
  // REMOVED: savedProfile = profile; — no global cache

  if (profile) {
    const storageKey = getProfileStorageKey(profile.telegram_id || userId);
    localStorage.setItem(storageKey, JSON.stringify(profile));
    removeLegacyProfileStorage();
  } else {
    const storageKey = getProfileStorageKey();
    localStorage.removeItem(storageKey);
    removeLegacyProfileStorage();
  }
}

async function apiPost(endpoint, body) {
  const baseUrl = API_BASE_URL ? API_BASE_URL.replace(/\/$/, '') : `${window.location.protocol}//${window.location.host}`;
  try {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
      mode: 'cors'
    });

    const rawText = await res.text();
    let data = {};
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch (e) {
      data = { error: rawText || 'Invalid JSON response from API' };
    }

    if (!res.ok) {
      return {
        success: false,
        error: data.error || `HTTP ${res.status}`,
        status: res.status,
        ...data
      };
    }

    return data;
  } catch (e) {
    console.error('API error:', e);
    return { success: false, error: e.message };
  }
}

async function saveProfileToServer(profile, telegramId) {
  const data = await apiPost('/api/save_profile', { telegram_id: telegramId, profile });
  return data.success === true;
}

async function fetchUserProfile(telegramId) {
  const data = await apiPost('/api/profile', { telegram_id: telegramId });
  return data.success ? data.user : null;
}

// === CITY SUGGEST ===
function suggestCity(val) {
  showSuggestions('city-suggestions', val, (city) => {
    document.getElementById('inp-city').value = city;
    document.getElementById('city-suggestions').style.display = 'none';
  });
}

function suggestCitySearch(val) {
  showSuggestions('sf-city-suggestions', val, (city) => {
    document.getElementById('sf-city').value = city;
    document.getElementById('sf-city-suggestions').style.display = 'none';
  });
}

function showSuggestions(containerId, val, onSelect) {
  const box = document.getElementById(containerId);
  if (!val || val.length < 1) { box.style.display = 'none'; return; }
  const filtered = uzbekCities.filter(c => c.toLowerCase().includes(val.toLowerCase())).slice(0, 8);
  if (!filtered.length) { box.style.display = 'none'; return; }

  const fnName = `_sugg_${containerId}`;
  box.innerHTML = filtered.map(c => {
    const region = getCityRegion(c);
    const label = region ? `${c} • ${region}` : c;
    return `<div class="suggestion-item" onclick="window['${fnName}'] && window['${fnName}']('${c}')">${label}</div>`;
  }).join('');
  window[fnName] = (city) => {
    onSelect(city);
    box.style.display = 'none';
  };
  box.style.display = 'block';
}

function showFaceDetectionWarning(message, detail) {
  if (detail !== undefined) {
    console.warn('Face detection warning:', detail);
  }
  showToast(message);
}

// === CHAT FUNCTIONS ===
async function loadChats() {
  const chatList = document.getElementById('chat-list');
  const emptyState = document.getElementById('chats-empty');
  if (!chatList) return;

  const telegramId = Number(userId);
  if (!Number.isFinite(telegramId) || telegramId <= 0) {
    chatList.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  chatList.innerHTML = '<div class="loading"><div class="spinner"></div> Yuklanmoqda...</div>';

  const data = await apiPost('/api/matches', { telegram_id: telegramId });
  if (!data.success || !data.matches || data.matches.length === 0) {
    chatList.innerHTML = '';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  chatList.innerHTML = data.matches.map(m => {
    const photo = m.photo_base64 || m.photo_file_id || '';
    const partnerData = escapeHtmlAttr(JSON.stringify(m));
    return `
      <div
        class="chat-item"
        data-match-id="${m.match_id}"
        data-name="${escapeHtmlAttr(m.full_name || '')}"
        data-photo="${escapeHtmlAttr(photo)}"
        data-partner="${partnerData}"
      >
        <div class="chat-item-photo">
          ${photo ? `<img src="${photo}" alt="" />` : (m.gender === 'erkak' ? ICONS.male : ICONS.female)}
        </div>
        <div class="chat-item-info">
          <div class="chat-item-name">${m.full_name}</div>
          <div class="chat-item-preview">Suhbatni ochish...</div>
        </div>
      </div>
    `;
  }).join('');

  chatList.querySelectorAll('.chat-item').forEach(item => {
    item.addEventListener('click', () => {
      openChatRoom(
        Number(item.dataset.matchId || 0),
        String(item.dataset.name || ''),
        String(item.dataset.photo || ''),
        item.dataset.partner || null
      );
    });
  });
}

function openChatRoom(matchId, name, photo, partnerData = null) {
  currentChatMatchId = matchId;
  let decodedPartner = null;

  try {
    if (partnerData) {
      const normalized = String(partnerData)
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');
      decodedPartner = JSON.parse(decodeURIComponent(normalized));
    }
  } catch (e) {
    try {
      decodedPartner = JSON.parse(String(partnerData)
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&'));
    } catch (fallbackError) {
      console.warn('Chat partner data parse failed', fallbackError);
    }
  }
  currentChatPartner = { name, photo, user: decodedPartner };
  document.getElementById('chat-modal').style.display = 'flex';
  document.getElementById('chat-user-name').textContent = name;
  document.getElementById('chat-user-photo').src = photo || '';
  document.getElementById('chat-user-name').style.cursor = 'pointer';
  document.getElementById('chat-user-photo').style.cursor = 'pointer';
  document.getElementById('chat-user-name').onclick = () => openPartnerProfile();
  document.getElementById('chat-user-photo').onclick = () => openPartnerProfile();
  loadChatMessages(matchId);

  if (chatRefreshInterval) clearInterval(chatRefreshInterval);
  chatRefreshInterval = setInterval(() => loadChatMessages(matchId), 3000);
}

function openPartnerProfile() {
  if (!currentChatPartner?.user) return;
  showProfileDetail(currentChatPartner.user, false);
}

function closeChatRoom() {
  document.getElementById('chat-modal').style.display = 'none';
  if (chatRefreshInterval) clearInterval(chatRefreshInterval);
  chatRefreshInterval = null;
  currentChatMatchId = null;
}

async function loadChatMessages(matchId) {
  const data = await apiPost('/api/chat/messages', { match_id: matchId });
  const container = document.getElementById('chat-messages');
  if (!data.success || !container) return;

  container.innerHTML = data.messages.map(m => {
    const isMe = m.sender_id == userId;
    if (typeof m.message === 'string' && m.message.startsWith('[RASM]')) {
      const imageSrc = m.message.replace(/^\[RASM\]\s*/, '').trim();
      const caption = isMe ? 'Siz yuborgan rasm' : 'Suhbatdosh rasmi';
      return `<div class="chat-msg ${isMe ? 'chat-msg-me' : 'chat-msg-them'}"><img src="${escapeHtml(imageSrc)}" alt="${caption}" title="To'liq ko'rinishda ochish" onclick="openPhotoViewer('${escapeJs(imageSrc)}', '${escapeJs(caption)}')" style="max-width:100%;border-radius:16px;display:block;cursor:zoom-in;" /></div>`;
    }
    return `<div class="chat-msg ${isMe ? 'chat-msg-me' : 'chat-msg-them'}">${escapeHtml(m.message)}</div>`;
  }).join('');
  container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message || !currentChatMatchId) return;

  // Xabar limit tekshirish
  const limitOk = await checkLimit('messages');
  if (!limitOk) {
    showLimitExceeded('messages');
    return;
  }

  const data = await apiPost('/api/chat/send', {
    match_id: currentChatMatchId,
    sender_id: userId,
    message: message
  });

  if (data.error === 'limit_exceeded') {
    showLimitExceeded('messages');
    return;
  }

  if (data.success) {
    input.value = '';
    loadChatMessages(currentChatMatchId);
  }
}

function toggleEmojiPanel() {
  const panel = document.getElementById('emoji-panel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function insertEmoji(emoji) {
  const input = document.getElementById('chat-input');
  input.value += emoji;
  input.focus();
}

async function sendImageMessage(input) {
  // Rasm yuborish - base64 orqali
  const file = input.files[0];
  if (!file) return;

  // Xabar limit tekshirish
  const limitOk = await checkLimit('messages');
  if (!limitOk) {
    showLimitExceeded('messages');
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result;
    const data = await apiPost('/api/chat/send', {
      match_id: currentChatMatchId,
      sender_id: userId,
      message: `[RASM] ${base64}`
    });

    if (data.error === 'limit_exceeded') {
      showLimitExceeded('messages');
      return;
    }

    if (data.success) {
      loadChatMessages(currentChatMatchId);
    }
  };
  reader.readAsDataURL(file);
}

// === MY PROFILE ===
async function loadMyProfile() {
  const container = document.getElementById('my-profile-content');
  if (!container) return;

  if (!userId) {
    container.innerHTML = '<div class="empty-state"><h3>Profilingiz yuklanmadi</h3></div>';
    return;
  }

  const user = await fetchUserProfile(userId);
  if (!user) {
    container.innerHTML = '<div class="empty-state"><h3>Anketa topilmadi</h3><p>Iltimos, avval anketa to\'ldiring.</p></div>';
    return;
  }

  const genderIcon = user.gender === 'erkak' ? ICONS.male : ICONS.female;
  const goals = (user.goals || []).map(g => `<span class="chip selected" style="pointer-events:none;">${g}</span>`).join('');
  const interests = (user.interests || []).slice(0, MAX_INTERESTS_ALLOWED).map(i => `<span class="chip selected" style="pointer-events:none;background:rgba(255,45,85,0.10);color:#FF2D55;border-color:rgba(255,45,85,0.25);">${i}</span>`).join('');
  const locationLabel = formatLocationLabel(user.city || '');
  const photo = user.photo_base64 || user.photo_file_id;

  container.innerHTML = `
    <div style="text-align:center; padding:20px;">
      ${photo ? `<img src="${photo}" style="width:120px;height:120px;object-fit:cover;border-radius:50%;margin-bottom:16px;" />` : `<div style="font-size:64px;">${genderIcon}</div>`}
      <h2 style="font-size:22px; font-weight:800;">${user.full_name}, ${user.age}</h2>
      <p style="color:var(--text-secondary);">📍 ${locationLabel || user.city || 'Joy ko\'rsatilmagan'}${user.zodiac ? ' • ' + user.zodiac : ''}</p>
      ${user.about ? `<p style="color:var(--text-secondary);font-size:14px;line-height:1.4;margin-top:8px;">${escapeHtml(user.about)}</p>` : ''}
    </div>
    <div class="card">
      <div class="section-title">Maqsad</div>
      <div class="chips-wrap">${goals || '<span style="color:var(--text-tertiary);font-size:14px;">Ko\'rsatilmagan</span>'}</div>
    </div>
    <div class="card">
      <div class="section-title">Qiziqishlar</div>
      <div class="chips-wrap">${interests || '<span style="color:var(--text-tertiary);font-size:14px;">Ko\'rsatilmagan</span>'}</div>
    </div>
  `;
}

// === MODAL HELPERS ===
function closeSearchResultsModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('search-results-modal').style.display = 'none';
}

function closePhotoViewer(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('photo-viewer-modal').style.display = 'none';
}

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  removeLegacyProfileStorage();

  // CRITICAL: Don't restore photo state until we know who the user is
  // This prevents cross-user photo leakage

  // Check if user has profile
  if (userId) {
    fetchUserProfile(userId).then(user => {
      if (user) {
        setSavedProfile(user);
        document.querySelector('.bottom-nav').style.display = 'flex';
        showPage('search');
        loadLimitStatus();
      } else {
        // No profile on server — clear any local data that might be from another user
        resetProfileFormState();
        showPage('profile');
      }
    });
  } else {
    // No userId detected — this is a fresh/guest session
    // Clear any stale data and show profile page
    resetProfileFormState();
    showPage('profile');
  }
});