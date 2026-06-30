class TeacherApp {
  constructor() {
    this.currentUser = CURRENT_TEACHER;
    this.currentPage = 'teacher-space';
    this.currentCourseId = null;
    this.currentCoursewareId = null;
    this.spaceTab = 'courses';
    this.rankingTab = 'rank-learn';

    this.coursePage = 1;
    this.coursePageSize = 8;
    this.courseFilterTypes = [];
    this.courseSearchKeyword = '';

    this.activityPage = 1;
    this.activityPageSize = 5;
    this.activityFilterStatus = '';
    this.activityFilterStart = '';
    this.activityFilterEnd = '';
    this.activitySearchKeyword = '';
    this.currentActivityId = null;
    this.fromActivityId = null;

    this.courseCompletionFilter = '';

    this.activityCourseFilterStatus = '';
    this.activityCourseSearchKeyword = '';

    this.learningPage = 1;
    this.learningPageSize = 10;

    this.learningSubTab = 'profile';
    this.myActivityPage = 1;
    this.myActivityPageSize = 10;
    this.myActivityFilterStatus = '';
    this.myActivityFilterStart = '';
    this.myActivityFilterEnd = '';
    this.myActivitySearchKeyword = '';
    this.learningCoursesPage = 1;
    this.learningCoursesPageSize = 10;
    this.learningFollowedPage = 1;
    this.learningFollowedPageSize = 10;
    this.learningReviewsPage = 1;
    this.learningReviewsPageSize = 10;

    this.myCoursesFilterTypes = [];
    this.myCoursesSearchKeyword = '';
    this.myFollowedFilterTypes = [];
    this.myFollowedSearchKeyword = '';
    this.myReviewsFilterTypes = [];
    this.myReviewsSearchKeyword = '';

    this.reviewRating = 0;
    this.editingReviewId = null;
    this.pendingConfirmCallback = null;
    this.likedReviewIds = new Set();
    this.courseFeedbacks = {
      c1: { content: '这门课程非常实用，让我对教师职业道德有了更深入的理解，案例丰富，受益匪浅！', fileName: '', submitTime: '2025-06-18 10:30:00' },
      c4: { content: '心理辅导技巧很实用，特别是处理学生情绪问题的方法，对班主任工作帮助很大。', fileName: '学习心得.docx', submitTime: '2025-06-19 16:00:00' }
    };
    this.editingCourseFeedbackId = null;

    this.aiChats = {};
    this.currentAiChatId = null;
    this.aiSidebarOpen = false;
    this.aiHistoryOpen = false;

    this.init();
  }

  init() {
    this.initFilterOptions();
    this.initMyCoursesTypeOptions();
    this.initMyFollowedTypeOptions();
    this.initMyReviewsTypeOptions();
    this.updateHeaderUser();
    // Hide AI float button on initial load (default page is teacher-space)
    const floatBtn = document.getElementById('ai-float-btn');
    if (floatBtn) floatBtn.style.display = 'none';
    // Ensure DOM is fully ready before rendering sidebar rankings
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.renderSpaceContent());
    } else {
      this.renderSpaceContent();
    }
  }

  refreshIcons() {
    if (window.lucide && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  renderSpaceContent() {
    if (this.spaceTab === 'courses') {
      this.renderCourseCards();
      this.renderSidebar();
    } else if (this.spaceTab === 'activities') {
      this.renderActivityCards();
      this.renderSidebar();
    } else if (this.spaceTab === 'learning') {
      this.renderMyLearning();
      this.renderSidebar();
      this.refreshIcons();
    }
  }

  renderSidebar() {
    const container = document.getElementById('rankings-sidebar');
    if (!container) return;
    if (this.spaceTab === 'courses') {
      container.style.display = '';
      container.innerHTML = `
        <div class="card mb-4">
          <div class="card-header">
            <span class="card-title">课程排名 Top5</span>
          </div>
          <div class="card-body">
            <div class="tabs mb-3">
              <div class="tab active" data-tab="rank-learn" onclick="app.switchRankingTab('rank-learn')">学习最多</div>
              <div class="tab" data-tab="rank-follow" onclick="app.switchRankingTab('rank-follow')">收藏最多</div>
              <div class="tab" data-tab="rank-rating" onclick="app.switchRankingTab('rank-rating')">评价最高</div>
            </div>
            <div id="ranking-list-container" class="ranking-list"></div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <span class="card-title">学习排名 Top5</span>
          </div>
          <div class="card-body">
            <div id="teacher-ranking-list" class="ranking-list"></div>
          </div>
        </div>
      `;
      this.renderRankings();
    } else if (this.spaceTab === 'activities') {
      container.style.display = '';
      container.innerHTML = `
        <div class="card">
          <div class="card-header">
            <span class="card-title">活动排名 Top10</span>
          </div>
          <div class="card-body">
            <div class="ranking-header">
              <div class="col-rank">排名</div>
              <div class="col-name">活动名称</div>
              <div class="col-value">教师人数</div>
            </div>
            ${ACTIVITY_RANKINGS.map(item => `
              <div class="ranking-item">
                <div class="ranking-rank ${item.rank <= 3 ? ['top1','top2','top3'][item.rank-1] : ''}">${item.rank}</div>
                <div class="ranking-name" title="${item.name}">${item.name}</div>
                <div class="ranking-value">${item.teacherCount}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (this.spaceTab === 'learning') {
      container.style.display = 'none';
      container.innerHTML = '';
    }
  }

  // ==================== Utilities ====================

  toast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  openModal(id) {
    document.getElementById(id).classList.add('active');
  }

  closeModal(id) {
    document.getElementById(id).classList.remove('active');
  }

  showConfirm(title, message, callback) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    this.pendingConfirmCallback = callback;
    this.openModal('modal-generic-confirm');
  }

  executeConfirm() {
    if (this.pendingConfirmCallback) {
      this.pendingConfirmCallback();
      this.pendingConfirmCallback = null;
    }
    this.closeModal('modal-generic-confirm');
  }

  exportToExcel(data, filename) {
    if (!data || data.length === 0) {
      this.toast('暂无数据可导出', 'warning');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  formatDate(dateStr) {
    if (!dateStr || dateStr === '-') return '-';
    return dateStr;
  }

  // ==================== Header ====================

  updateHeaderUser() {
    document.getElementById('header-user-name').textContent = this.currentUser.name;
    document.getElementById('header-user-org').textContent = this.currentUser.orgName;
  }

  // ==================== Routing ====================

  goTo(page, ...args) {
    document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    this.currentPage = page;

    const menuPage = ['course-detail', 'courseware-learn', 'activity-detail'].includes(page) ? 'teacher-space' : page;
    document.querySelectorAll('.teacher-menu-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === menuPage);
    });

    if (page === 'teacher-space') {
      this.fromActivityId = null;
      this.renderSpaceContent();
    } else if (page === 'course-detail' && args[0]) {
      this.currentCourseId = args[0];
      this.renderCourseDetail();
    } else if (page === 'courseware-learn' && args[0] && args[1]) {
      this.currentCourseId = args[0];
      this.currentCoursewareId = args[1];
      this.renderCoursewarePage();
    } else if (page === 'activity-detail' && args[0]) {
      this.currentActivityId = args[0];
      this.fromActivityId = null;
      this.renderActivityDetail();
    } else {
      this.fromActivityId = null;
    }
    // AI float button visibility: only on course-detail page
    const floatBtn = document.getElementById('ai-float-btn');
    if (floatBtn) {
      floatBtn.style.display = (page === 'course-detail' || page === 'courseware-learn') ? 'flex' : 'none';
    }
    // Close AI sidebar when leaving course-detail
    if (page !== 'course-detail' && page !== 'courseware-learn' && this.aiSidebarOpen) {
      this.closeAiAgentSidebar();
    }

    // Update AI context-aware quick commands
    setTimeout(() => this.renderAiContextCommands(), 100);

    this.refreshIcons();
    window.scrollTo(0, 0);
  }

  backToCourseDetail() {
    if (this.currentCourseId) {
      this.goTo('course-detail', this.currentCourseId);
    } else {
      this.goTo('teacher-space');
    }
  }

  // ==================== Filter Init ====================

  initFilterOptions() {
    const container = document.getElementById('course-type-options');
    const buildOptions = (types, level = 0) => {
      let html = '';
      types.forEach(t => {
        const indent = level * 16;
        html += `
          <label class="multi-select-option" style="padding-left:${12 + indent}px">
            <input type="checkbox" value="${t.id}" data-name="${t.name}" onchange="app.onCourseTypeCheckboxChange()">
            <span>${t.name}</span>
          </label>`;
        if (t.children && t.children.length) {
          html += buildOptions(t.children, level + 1);
        }
      });
      return html;
    };
    container.innerHTML = buildOptions(MOCK_COURSE_TYPES);
    this.updateCourseTypeSelectLabel();
  }

  toggleCourseTypeDropdown(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('course-type-dropdown');
    dropdown.classList.toggle('active');
    if (dropdown.classList.contains('active')) {
      document.addEventListener('click', this.closeCourseTypeDropdownOnClickOutside, { once: true });
    }
  }

  closeCourseTypeDropdownOnClickOutside(e) {
    const wrapper = document.getElementById('course-type-multi-select');
    if (wrapper && !wrapper.contains(e.target)) {
      document.getElementById('course-type-dropdown').classList.remove('active');
    }
  }

  onCourseTypeCheckboxChange() {
    this.updateCourseTypeSelectLabel();
  }

  updateCourseTypeSelectLabel() {
    const checked = Array.from(document.querySelectorAll('#course-type-options input[type="checkbox"]:checked'));
    const label = document.getElementById('course-type-select-label');
    if (checked.length === 0) {
      label.textContent = '全部类型';
    } else if (checked.length <= 2) {
      label.textContent = checked.map(cb => cb.dataset.name).join('、');
    } else {
      label.textContent = `已选 ${checked.length} 项`;
    }
  }

  filterCourseTypeOptions(keyword) {
    const kw = keyword.toLowerCase();
    document.querySelectorAll('#course-type-options .multi-select-option').forEach(el => {
      const text = el.textContent.toLowerCase();
      el.style.display = text.includes(kw) ? 'flex' : 'none';
    });
  }

  clearCourseTypeSelection() {
    document.querySelectorAll('#course-type-options input[type="checkbox"]').forEach(cb => cb.checked = false);
    this.updateCourseTypeSelectLabel();
    this.courseFilterTypes = [];
    this.coursePage = 1;
    this.renderCourseCards();
  }

  confirmCourseTypeSelection() {
    document.getElementById('course-type-dropdown').classList.remove('active');
    this.courseFilterTypes = this.getSelectedCourseTypeIds();
    this.coursePage = 1;
    this.renderCourseCards();
  }

  getSelectedCourseTypeIds() {
    return Array.from(document.querySelectorAll('#course-type-options input[type="checkbox"]:checked')).map(cb => cb.value);
  }

  // ==================== Training Space - Courses ====================

  filterCourses() {
    this.courseSearchKeyword = document.getElementById('course-search-input').value.trim().toLowerCase();
    this.courseCompletionFilter = document.getElementById('course-completion-filter').value;
    this.coursePage = 1;
    this.renderCourseCards();
  }

  getFilteredCourses() {
    let courses = MOCK_COURSES.filter(c => c.status === 'published');
    if (this.courseFilterTypes.length > 0) {
      courses = courses.filter(c => c.type && this.courseFilterTypes.some(id => c.type.includes(id)));
    }
    if (this.courseSearchKeyword) {
      courses = courses.filter(c =>
        c.name.toLowerCase().includes(this.courseSearchKeyword) ||
        c.instructor.toLowerCase().includes(this.courseSearchKeyword)
      );
    }
    if (this.courseCompletionFilter) {
      const relations = TEACHER_COURSE_RELATIONS[this.currentUser.id] || [];
      courses = courses.filter(c => {
        const rel = relations.find(r => r.courseId === c.id);
        const progress = rel ? rel.progress : 0;
        const isLearned = progress === 100;
        const isInProgress = progress > 0 && progress < 100;
        if (this.courseCompletionFilter === 'learned') return isLearned;
        if (this.courseCompletionFilter === 'inprogress') return isInProgress;
        return !isLearned && !isInProgress;
      });
    }
    return courses;
  }

  renderCourseCards() {
    const courses = this.getFilteredCourses();
    const start = (this.coursePage - 1) * this.coursePageSize;
    const pageList = courses.slice(start, start + this.coursePageSize);
    const container = document.getElementById('course-card-list');

    if (pageList.length === 0) {
      container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div style="font-size:48px;margin-bottom:12px;">&#128218;</div><div>暂无课程</div></div>`;
      this.renderPagination('course-list-pagination', courses.length, this.coursePageSize, this.coursePage, (p) => {
        this.coursePage = p;
        this.renderCourseCards();
      });
      return;
    }

    container.innerHTML = pageList.map(course => {
      const reviews = COURSE_REVIEWS[course.id] || [];
      const reviewCount = reviews.length;
      const relation = (TEACHER_COURSE_RELATIONS[this.currentUser.id] || []).find(r => r.courseId === course.id);
      const progress = relation ? relation.progress : 0;
      const isLearned = progress === 100;
      const isInProgress = progress > 0 && progress < 100;
      let statusTag;
      if (isLearned) {
        statusTag = '<span class="tag tag-success">已学</span>';
      } else if (isInProgress) {
        statusTag = '<span class="tag tag-warning">进行中</span>';
      } else {
        statusTag = '<span class="tag tag-default">未学</span>';
      }
      return `
        <div class="course-card" onclick="app.goTo('course-detail', '${course.id}')">
          <div style="position:relative;">
            <img src="${course.cover}" class="course-card-cover" alt="${course.name}">
            <div style="position:absolute;top:8px;left:8px;display:flex;gap:4px;">
              ${statusTag}
            </div>
          </div>
          <div class="course-card-body">
            <div class="course-card-title">${course.name}</div>
            <div class="course-card-meta">
              <span class="star-rating">${this.renderStars(course.rating)}</span>
              <span>${course.rating || '0.0'}</span>
            </div>
            <div class="course-card-meta" style="margin-bottom:4px;">${course.instructor}</div>
            <div class="course-card-stats">
              <span>&#128221; ${course.sections} 课件</span>
              <span>&#128100; ${course.learners} 学习</span>
              <span>&#128172; ${reviewCount} 评价</span>
            </div>
            ${isLearned || isInProgress ? `
              <div class="mt-2">
                <div class="progress-bar-thin"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
                <div class="text-xs text-tertiary mt-1">${isLearned ? '已学完' : '已学习 ' + progress + '%'}</div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    this.renderPagination('course-list-pagination', courses.length, this.coursePageSize, this.coursePage, (p) => {
      this.coursePage = p;
      this.renderCourseCards();
    });
  }

  renderStars(rating) {
    const val = rating || 0;
    let html = '';
    for (let i = 1; i <= 5; i++) {
      const fillPct = Math.max(0, Math.min(1, val - (i - 1))) * 100;
      html += `
        <span class="star-wrapper">
          <span class="star-bg">&#9733;</span>
          <span class="star-fg" style="width:${fillPct}%">&#9733;</span>
        </span>`;
    }
    return html;
  }

  // ==================== Training Space - Activities ====================

  filterActivities() {
    this.activityFilterStatus = document.getElementById('activity-filter-status').value;
    this.activityFilterStart = document.getElementById('activity-filter-start').value;
    this.activityFilterEnd = document.getElementById('activity-filter-end').value;
    this.activitySearchKeyword = document.getElementById('activity-search-input').value.trim().toLowerCase();
    this.activityPage = 1;
    this.renderActivityCards();
  }

  getFilteredActivities() {
    const relations = TEACHER_ACTIVITY_RELATIONS[this.currentUser.id] || [];
    let activities = relations.map(rel => {
      const activity = MOCK_ACTIVITIES.find(a => a.id === rel.activityId);
      return { ...activity, ...rel };
    });
    if (this.activityFilterStatus) {
      activities = activities.filter(a => a.status === this.activityFilterStatus);
    }
    if (this.activityFilterStart) {
      activities = activities.filter(a => a.endTime >= this.activityFilterStart);
    }
    if (this.activityFilterEnd) {
      activities = activities.filter(a => a.startTime <= this.activityFilterEnd);
    }
    if (this.activitySearchKeyword) {
      activities = activities.filter(a => a.name.toLowerCase().includes(this.activitySearchKeyword));
    }
    return activities;
  }

  renderActivityCards() {
    const activities = this.getFilteredActivities();
    const start = (this.activityPage - 1) * this.activityPageSize;
    const pageList = activities.slice(start, start + this.activityPageSize);
    const container = document.getElementById('activity-card-list');

    if (pageList.length === 0) {
      container.innerHTML = `<div class="empty-state"><div style="font-size:48px;margin-bottom:12px;">&#128203;</div><div>暂无培训活动</div></div>`;
      this.renderPagination('activity-list-pagination', activities.length, this.activityPageSize, this.activityPage, (p) => {
        this.activityPage = p;
        this.renderActivityCards();
      });
      return;
    }

    container.innerHTML = pageList.map(act => {
      const statusMap = { ongoing: { label: '进行中', cls: 'tag-success' }, ended: { label: '已结束', cls: 'tag-default' }, upcoming: { label: '未开始', cls: 'tag-warning' } };
      const s = statusMap[act.status] || statusMap.upcoming;
      const courseCount = (MOCK_ACTIVITY_COURSES[act.id] || []).length;
      const btnText = act.status === 'ended' ? '查看学习记录' : '去学习';
      return `
        <div class="activity-card">
          <img src="${act.cover}" class="activity-card-cover" alt="${act.name}">
          <div class="activity-card-body">
            <div class="flex items-center gap-2 mb-1">
              <span class="tag ${s.cls}">${s.label}</span>
              ${act.hasHours ? `<span class="tag tag-info">需修满 ${act.requireHours} 学时</span>` : ''}
            </div>
            <div class="activity-card-title">${act.name}</div>
            <div class="activity-card-meta">
              <span>&#128197; ${act.startTime} ~ ${act.endTime}</span>
              <span>&#128218; ${courseCount} 门课程</span>
              ${act.hasHours ? `<span>&#9201; 已获得 ${act.earnedHours || 0} 学时</span>` : ''}
            </div>
            <div class="mt-3">
              <button class="btn btn-primary btn-sm" onclick="app.goToActivityDetail('${act.id}')">${btnText}</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.renderPagination('activity-list-pagination', activities.length, this.activityPageSize, this.activityPage, (p) => {
      this.activityPage = p;
      this.renderActivityCards();
    });
  }

  goToActivityDetail(activityId) {
    this.goTo('activity-detail', activityId);
  }

  renderActivityDetail() {
    const activity = MOCK_ACTIVITIES.find(a => a.id === this.currentActivityId);
    if (!activity) return;
    document.getElementById('activity-detail-breadcrumb').textContent = activity.name;
    const detail = ACTIVITY_DETAILS[this.currentActivityId] || { goal: '', attachments: [] };
    const courses = MOCK_ACTIVITY_COURSES[this.currentActivityId] || [];
    const participants = MOCK_ACTIVITY_PARTICIPANTS[this.currentActivityId] || [];
    const totalParticipants = participants.length;
    const myRelations = TEACHER_COURSE_RELATIONS[this.currentUser.id] || [];
    const totalCourses = courses.length;
    const myCompletedCourses = courses.filter(c => {
      const rel = myRelations.find(r => r.courseId === c.courseId);
      return rel && rel.progress === 100;
    }).length;
    const myIncompleteCourses = totalCourses - myCompletedCourses;
    const statusMap = { ongoing: { label: '进行中', cls: 'tag-success' }, ended: { label: '已结束', cls: 'tag-default' }, upcoming: { label: '未开始', cls: 'tag-warning' } };
    const s = statusMap[activity.status] || statusMap.upcoming;

    let html = `
      <div class="activity-detail-header">
        <img src="${activity.cover}" class="activity-detail-cover" alt="${activity.name}">
        <div class="activity-detail-info">
          <div class="flex items-center gap-2 mb-2">
            <span class="tag ${s.cls}">${s.label}</span>
            ${activity.hasHours ? `<span class="tag tag-info">需修满 ${activity.requireHours} 学时</span>` : ''}
          </div>
          <div class="activity-detail-title">${activity.name}</div>
          <div class="activity-detail-meta">
            <span>&#128197; ${activity.startTime} ~ ${activity.endTime}</span>
            <span>&#128100; ${totalParticipants} 人参与</span>
            <span>&#128221; ${courses.length} 门课程</span>
          </div>
          ${detail.goal ? `
            <div class="mt-3 text-sm text-secondary leading-relaxed" style="max-width:600px;">
              <span class="font-medium" style="color:var(--text-primary);">培训目标：</span>${detail.goal}
            </div>
          ` : ''}
          ${detail.attachments.length > 0 ? `
            <div class="mt-2 flex flex-wrap gap-2">
              ${detail.attachments.map(att => `
                <span class="flex items-center gap-1 text-xs text-secondary bg-hover px-2 py-1 rounded border" style="cursor:pointer;" onclick="app.downloadMaterial('#')">
                  <span>&#128196;</span>
                  <span>${att.name}</span>
                  <span class="text-tertiary">${att.size}</span>
                </span>
              `).join('')}
            </div>
          ` : ''}
          ${activity.studyMode ? `
            <div class="mt-3 text-sm text-secondary">
              <span class="font-medium" style="color:var(--text-primary);">完成学习方式：</span>
              ${activity.studyMode === 'complete' ? '<span class="flex items-center gap-1" style="display:inline-flex;">&#9989; 完成课程下所有课件学习</span>' : ''}
              ${activity.studyMode === 'view' ? '<span class="flex items-center gap-1" style="display:inline-flex;">&#128221; 查看课程</span>' : ''}
              ${activity.studyMode === 'feedback' ? '<span class="flex items-center gap-1" style="display:inline-flex;">&#128172; 提交学习心得</span>' : ''}
              ${activity.studyMode === 'complete_feedback' ? '<span class="flex items-center gap-1" style="display:inline-flex;">&#9989; 完成课程下所有课件学习</span><span class="flex items-center gap-1" style="display:inline-flex;">&#128172; 提交学习心得</span>' : ''}
            </div>
          ` : ''}
        </div>
      </div>

      <div class="space-layout mt-6">
        <div class="space-main">
          <div class="card">
            <div class="card-header"><span class="card-title">课程列表</span></div>
            <div class="card-body">
              <div class="filter-bar" style="margin-bottom:12px;">
                <select id="activity-course-filter-status" class="form-select" style="width:120px;" onchange="app.filterActivityCourses()">
                  <option value="">全部</option>
                  <option value="learned">已学</option>
                  <option value="unlearned">未学</option>
                </select>
                <div class="search-input" style="max-width:280px;">
                  <span class="search-icon">&#128269;</span>
                  <input type="text" id="activity-course-search-input" class="form-input" placeholder="请输入课程名称、讲师/机构" oninput="app.filterActivityCourses()">
                </div>
              </div>
              <div id="activity-course-list" class="course-card-grid" style="grid-template-columns:repeat(2,1fr);"></div>
            </div>
          </div>
        </div>

        <aside class="space-sidebar">
          <div class="card mb-4">
            <div class="card-header"><span class="card-title">完成学习进度</span></div>
            <div class="card-body">
              <div id="activity-pie-chart" style="width:100%;height:220px;"></div>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><span class="card-title">学习排行榜 Top10</span></div>
            <div class="card-body">
              <div class="ranking-header">
                <div class="col-rank">排名</div>
                <div class="col-name">教师姓名</div>
                <div class="col-value">${activity.hasHours ? '学时' : '课件数'}</div>
              </div>
              ${STUDY_RANKINGS.map(item => `
                <div class="ranking-item">
                  <div class="ranking-rank ${item.rank <= 3 ? ['top1','top2','top3'][item.rank-1] : ''}">${item.rank}</div>
                  <div class="ranking-name">${item.name}</div>
                  <div class="ranking-value">${activity.hasHours ? item.hours : item.coursewareCount}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </aside>
      </div>
    `;

    document.getElementById('activity-detail-content').innerHTML = html;
    this.renderActivityCourseList();
    this.renderActivityPieChart(myCompletedCourses, myIncompleteCourses);
  }

  filterActivityCourses() {
    this.renderActivityCourseList();
  }

  renderActivityCourseList() {
    const courses = MOCK_ACTIVITY_COURSES[this.currentActivityId] || [];
    const myRelations = TEACHER_COURSE_RELATIONS[this.currentUser.id] || [];
    const statusFilter = document.getElementById('activity-course-filter-status')?.value || '';
    const keyword = document.getElementById('activity-course-search-input')?.value.trim().toLowerCase() || '';

    let filtered = courses.filter(c => {
      const rel = myRelations.find(r => r.courseId === c.courseId);
      const progress = rel ? rel.progress : 0;
      const isLearned = progress > 0;

      if (statusFilter === 'learned' && !isLearned) return false;
      if (statusFilter === 'unlearned' && isLearned) return false;

      if (keyword) {
        const searchText = `${c.name} ${c.instructor}`.toLowerCase();
        if (!searchText.includes(keyword)) return false;
      }

      return true;
    });

    const container = document.getElementById('activity-course-list');
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = '<div class="text-center text-secondary py-8">暂无符合条件的课程</div>';
      return;
    }

    container.innerHTML = filtered.map(c => {
      const course = MOCK_COURSES.find(mc => mc.id === c.courseId);
      const reviews = COURSE_REVIEWS[c.courseId] || [];
      const reviewCount = reviews.length;
      const rel = myRelations.find(r => r.courseId === c.courseId);
      const progress = rel ? rel.progress : 0;
      const isLearned = progress > 0;
      const isCompleted = progress === 100;
      const statusTag = isCompleted ? '<span class="tag tag-success">已学</span>' : '<span class="tag tag-default">未学</span>';
      const hoursLabel = c.hours > 0 ? `<span class="tag tag-info">${c.hours} 学时</span>` : '';

      return `
        <div class="course-card" onclick="app.fromActivityId = app.currentActivityId; app.goTo('course-detail', '${c.courseId}')">
          <div style="position:relative;">
            <img src="${course?.cover || ''}" class="course-card-cover" alt="${c.name}">
            <div style="position:absolute;top:8px;left:8px;display:flex;gap:4px;">
              ${statusTag}
              ${hoursLabel}
            </div>
          </div>
          <div class="course-card-body">
            <div class="course-card-title">${c.name}</div>
            <div class="course-card-meta">
              <span class="star-rating">${this.renderStars(course?.rating || 0)}</span>
              <span>${course?.rating || '0.0'}</span>
            </div>
            <div class="course-card-meta" style="margin-bottom:4px;">${c.instructor}</div>
            <div class="course-card-stats">
              <span>&#128221; ${course?.sections || 0} 课件</span>
              <span>&#128100; ${course?.learners || 0} 学习</span>
              <span>&#128172; ${reviewCount} 评价</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderActivityPieChart(completed, incomplete) {
    const chartDom = document.getElementById('activity-pie-chart');
    if (!chartDom) return;
    const total = completed + incomplete;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const chart = echarts.init(chartDom);
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { bottom: '0%', left: 'center', textStyle: { fontSize: 12 } },
      title: {
        text: `${pct}%`,
        subtext: '完成率',
        left: 'center',
        top: '42%',
        textStyle: { fontSize: 24, fontWeight: 'bold', color: '#292524' },
        subtextStyle: { fontSize: 12, color: '#A8A29E' }
      },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#FAFAF9', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: false } },
        data: [
          { value: completed, name: '已完成', itemStyle: { color: '#C8000C' } },
          { value: incomplete, name: '未完成', itemStyle: { color: '#A8A29E' } }
        ]
      }]
    });
  }

  // ==================== Training Space - My Learning ====================

  renderMyLearning() {
    document.querySelectorAll('.learning-sub-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.subtab === this.learningSubTab);
    });
    document.querySelectorAll('.learning-sub-content').forEach(c => {
      c.classList.toggle('active', c.id === 'learning-sub-' + this.learningSubTab);
    });

    if (this.learningSubTab === 'activities') {
      this.renderMyActivities();
    } else if (this.learningSubTab === 'courses') {
      this.renderMyCourses();
    } else if (this.learningSubTab === 'followed') {
      this.renderMyFollowed();
    } else if (this.learningSubTab === 'reviews') {
      this.renderMyReviews();
    } else if (this.learningSubTab === 'profile') {
      this.renderProfileStats();
      this.renderAiInsight();
    }
  }

  switchLearningSubTab(subtab) {
    this.learningSubTab = subtab;
    this.renderMyLearning();
    this.refreshIcons();
  }

  getMyActivities() {
    const myRelations = TEACHER_ACTIVITY_RELATIONS[this.currentUser.id] || [];
    return myRelations.map(rel => {
      const activity = MOCK_ACTIVITIES.find(a => a.id === rel.activityId);
      if (!activity) return null;
      const courses = MOCK_ACTIVITY_COURSES[activity.id] || [];
      const myCourseRelations = TEACHER_COURSE_RELATIONS[this.currentUser.id] || [];
      const completedCourses = courses.filter(c => {
        const cr = myCourseRelations.find(r => r.courseId === c.courseId);
        return cr && cr.progress === 100;
      }).length;
      return {
        ...rel,
        activityId: activity.id,
        activityName: activity.name,
        startTime: activity.startTime,
        endTime: activity.endTime,
        status: activity.status,
        requireHours: activity.requireHours,
        hasHours: activity.hasHours,
        totalCourses: courses.length,
        completedCourses,
        progressText: `${completedCourses}/${courses.length}`
      };
    }).filter(Boolean);
  }

  renderMyActivities() {
    let data = this.getMyActivities();
    if (this.myActivityFilterStatus) {
      data = data.filter(a => a.status === this.myActivityFilterStatus);
    }
    if (this.myActivityFilterStart) {
      data = data.filter(a => a.endTime >= this.myActivityFilterStart);
    }
    if (this.myActivityFilterEnd) {
      data = data.filter(a => a.startTime <= this.myActivityFilterEnd);
    }
    if (this.myActivitySearchKeyword) {
      const kw = this.myActivitySearchKeyword.toLowerCase();
      data = data.filter(a => a.activityName.toLowerCase().includes(kw));
    }

    const start = (this.myActivityPage - 1) * this.myActivityPageSize;
    const pageList = data.slice(start, start + this.myActivityPageSize);
    const tbody = document.querySelector('#my-activities-table tbody');

    const statusLabels = { upcoming: '未开始', ongoing: '进行中', ended: '已结束' };
    const statusClasses = { upcoming: 'tag-upcoming', ongoing: 'tag-ongoing', ended: 'tag-ended' };

    if (pageList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-secondary">暂无活动记录</td></tr>`;
      this.renderPagination('my-activities-pagination', data.length, this.myActivityPageSize, this.myActivityPage, (p) => {
        this.myActivityPage = p;
        this.renderMyActivities();
      });
      return;
    }

    tbody.innerHTML = pageList.map((a, idx) => `
      <tr>
        <td>${start + idx + 1}</td>
        <td>${a.activityName}</td>
        <td>${a.startTime} ~ ${a.endTime}</td>
        <td><span class="tag ${statusClasses[a.status] || 'tag-default'}">${statusLabels[a.status] || a.status}</span></td>
        <td>${a.hasHours ? a.requireHours : '-'}</td>
        <td>${a.earnedHours}</td>
        <td><span class="tooltip-wrap">${a.progressText}<span class="tooltip-text">已学课程/活动课程总数</span></span></td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="app.openStudyReport('${a.activityId}')">查看学习报告</button>
          <button class="btn btn-primary btn-sm" onclick="app.goTo('activity-detail', '${a.activityId}')">${a.status === 'ended' ? '查看学习记录' : '去学习'}</button>
        </td>
      </tr>
    `).join('');

    this.renderPagination('my-activities-pagination', data.length, this.myActivityPageSize, this.myActivityPage, (p) => {
      this.myActivityPage = p;
      this.renderMyActivities();
    });
  }

  filterMyActivities() {
    this.myActivityFilterStatus = document.getElementById('my-activity-filter-status').value;
    this.myActivityFilterStart = document.getElementById('my-activity-filter-start').value;
    this.myActivityFilterEnd = document.getElementById('my-activity-filter-end').value;
    this.myActivitySearchKeyword = document.getElementById('my-activity-search-input').value;
    this.myActivityPage = 1;
    this.renderMyActivities();
  }

  openStudyReport(activityId) {
    this.currentStudyReportActivityId = activityId;
    this.renderStudyReport(activityId);
    this.openModal('modal-study-report');
  }

  renderStudyReport(activityId) {
    const activity = MOCK_ACTIVITIES.find(a => a.id === activityId);
    if (!activity) return;
    const courses = MOCK_ACTIVITY_COURSES[activityId] || [];
    const myRelations = TEACHER_COURSE_RELATIONS[this.currentUser.id] || [];
    const myActivityRel = (TEACHER_ACTIVITY_RELATIONS[this.currentUser.id] || []).find(r => r.activityId === activityId);
    const earnedHours = myActivityRel ? myActivityRel.earnedHours : 0;

    document.getElementById('study-report-title').textContent = activity.name + ' - 学习报告';

    const hoursChart = echarts.init(document.getElementById('study-report-hours-chart'));
    hoursChart.setOption({
      title: { text: '学时获得情况', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['需修满学时', '已获得学时'] },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: [
          { value: activity.requireHours, itemStyle: { color: '#A8A29E' } },
          { value: earnedHours, itemStyle: { color: '#C8000C' } }
        ],
        barWidth: '40%',
        label: { show: true, position: 'top' }
      }]
    });

    const completedCount = courses.filter(c => {
      const cr = myRelations.find(r => r.courseId === c.courseId);
      return cr && cr.progress === 100;
    }).length;
    const coursesChart = echarts.init(document.getElementById('study-report-courses-chart'));
    coursesChart.setOption({
      title: { text: '课程学习情况', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['总课程数', '已学习课程'] },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: [
          { value: courses.length, itemStyle: { color: '#A8A29E' } },
          { value: completedCount, itemStyle: { color: '#C8000C' } }
        ],
        barWidth: '40%',
        label: { show: true, position: 'top' }
      }]
    });

    const tbody = document.querySelector('#study-report-table tbody');
    if (courses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-8 text-secondary">暂无课程数据</td></tr>`;
      return;
    }

    tbody.innerHTML = courses.map((c, idx) => {
      const cr = myRelations.find(r => r.courseId === c.courseId);
      const isCompleted = cr && cr.progress === 100;
      const completeTime = isCompleted ? (cr.lastLearnTime || '-') : '-';
      const feedback = this.courseFeedbacks[c.courseId];
      const feedbackCell = feedback
        ? `<button class="btn btn-ghost btn-sm" onclick="app.viewFeedbackDetail('${c.courseId}')">查看</button>`
        : '-';
      return `
        <tr>
          <td>${idx + 1}</td>
          <td>${c.name}</td>
          <td>${cr ? cr.earnedHours : 0}</td>
          <td>${completeTime}</td>
          <td>${feedbackCell}</td>
        </tr>
      `;
    }).join('');
  }

  exportStudyReport() {
    const activityId = this.currentStudyReportActivityId;
    if (!activityId) return;
    const activity = MOCK_ACTIVITIES.find(a => a.id === activityId);
    const courses = MOCK_ACTIVITY_COURSES[activityId] || [];
    const myRelations = TEACHER_COURSE_RELATIONS[this.currentUser.id] || [];
    const records = courses.map((c, idx) => {
      const cr = myRelations.find(r => r.courseId === c.courseId);
      const isCompleted = cr && cr.progress === 100;
      const feedback = this.courseFeedbacks[c.courseId];
      return {
        '序号': idx + 1,
        '课程名称': c.name,
        '获得学时': cr ? cr.earnedHours : 0,
        '完成时间': isCompleted ? (cr.lastLearnTime || '-') : '-',
        '学习心得': feedback ? feedback.content : '-'
      };
    });
    this.exportToExcel(records, (activity ? activity.name : '学习报告') + '_学习明细');
  }

  viewFeedbackDetail(courseId) {
    const feedback = this.courseFeedbacks[courseId];
    if (!feedback) return;
    const course = MOCK_COURSES.find(c => c.id === courseId);
    const courseName = course ? course.name : '课程';
    document.getElementById('feedback-detail-course-name').textContent = courseName;
    document.getElementById('feedback-detail-content').textContent = feedback.content || '无学习心得内容';
    document.getElementById('feedback-detail-time').textContent = feedback.submitTime || '-';

    const attachmentSection = document.getElementById('feedback-detail-attachment');
    if (feedback.fileName) {
      attachmentSection.style.display = 'block';
      document.getElementById('feedback-detail-file-name').textContent = feedback.fileName;
    } else {
      attachmentSection.style.display = 'none';
    }

    this.openModal('modal-feedback-detail');
  }

  previewFeedbackAttachment() {
    const fileName = document.getElementById('feedback-detail-file-name').textContent;
    if (!fileName) return;
    this.showMaterialPreview('feedback-attachment', fileName, '', '#', true);
  }

  downloadFeedbackAttachment() {
    const fileName = document.getElementById('feedback-detail-file-name').textContent;
    if (!fileName) return;
    this.toast('开始下载：' + fileName, 'success');
  }

  getMyLearningRecords() {
    const relations = TEACHER_COURSE_RELATIONS[this.currentUser.id] || [];
    return relations.filter(r => r.enrolled).map(r => {
      const course = MOCK_COURSES.find(c => c.id === r.courseId);
      return { ...r, courseName: course ? course.name : '-', cover: course ? course.cover : '' };
    });
  }

  getCoursewareCount(courseId) {
    const catalog = MOCK_COURSE_CATALOG[courseId];
    if (!catalog || !catalog.chapters) return 0;
    return catalog.chapters.reduce((sum, ch) => sum + (ch.children ? ch.children.length : 0), 0);
  }

  getCourseLearnStats(courseId, teacherId) {
    const records = (TEACHER_LEARNING_RECORDS[teacherId] || []).filter(r => r.courseId === courseId);
    const completedCount = records.filter(r => r.completed).length;
    const totalDuration = records.reduce((sum, r) => sum + (r.duration || 0), 0);
    const lastLearnTime = records.length > 0
      ? records.sort((a, b) => new Date(b.learnTime) - new Date(a.learnTime))[0].learnTime
      : null;
    return { completedCount, totalDuration, lastLearnTime };
  }

  formatDuration(minutes) {
    if (!minutes || minutes <= 0) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}小时${m}分`;
    if (h > 0) return `${h}小时`;
    return `${m}分钟`;
  }

  getFilteredMyCourses() {
    let records = this.getMyLearningRecords();
    if (this.myCoursesFilterTypes.length > 0) {
      records = records.filter(r => {
        const course = MOCK_COURSES.find(c => c.id === r.courseId);
        return course && course.type && this.myCoursesFilterTypes.some(id => course.type.includes(id));
      });
    }
    if (this.myCoursesSearchKeyword) {
      const kw = this.myCoursesSearchKeyword.toLowerCase();
      records = records.filter(r => {
        const course = MOCK_COURSES.find(c => c.id === r.courseId);
        const nameMatch = course && course.name.toLowerCase().includes(kw);
        const instructorMatch = course && course.instructor.toLowerCase().includes(kw);
        const typeMatch = course && course.typeName && course.typeName.toLowerCase().includes(kw);
        return nameMatch || instructorMatch || typeMatch;
      });
    }
    return records;
  }

  renderMyCourses() {
    const records = this.getFilteredMyCourses();
    const start = (this.learningCoursesPage - 1) * this.learningCoursesPageSize;
    const pageList = records.slice(start, start + this.learningCoursesPageSize);
    const tbody = document.querySelector('#learning-courses-table tbody');
    document.getElementById('learning-total-courses').textContent = records.length;

    if (pageList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-secondary">暂无学习记录</td></tr>`;
      this.renderPagination('learning-courses-pagination', records.length, this.learningCoursesPageSize, this.learningCoursesPage, (p) => {
        this.learningCoursesPage = p;
        this.renderMyCourses();
      });
      return;
    }

    tbody.innerHTML = pageList.map((r, idx) => {
      const course = MOCK_COURSES.find(c => c.id === r.courseId);
      const totalCw = this.getCoursewareCount(r.courseId);
      const stats = this.getCourseLearnStats(r.courseId, this.currentUser.id);
      return `
        <tr>
          <td>${start + idx + 1}</td>
          <td>${r.courseName}</td>
          <td>${course ? course.instructor : '-'}</td>
          <td>${totalCw}</td>
          <td>${stats.completedCount}/${totalCw}</td>
          <td>${course ? course.typeName : '-'}</td>
          <td>${stats.lastLearnTime || '-'}</td>
          <td><button class="btn btn-primary btn-sm" onclick="app.goTo('course-detail', '${r.courseId}')">去学习</button></td>
        </tr>
      `;
    }).join('');

    this.renderPagination('learning-courses-pagination', records.length, this.learningCoursesPageSize, this.learningCoursesPage, (p) => {
      this.learningCoursesPage = p;
      this.renderMyCourses();
    });
  }

  exportMyLearningCourses() {
    const records = this.getFilteredMyCourses().map((r, idx) => {
      const course = MOCK_COURSES.find(c => c.id === r.courseId);
      const totalCw = this.getCoursewareCount(r.courseId);
      const stats = this.getCourseLearnStats(r.courseId, this.currentUser.id);
      return {
        '序号': idx + 1,
        '课程名称': r.courseName,
        '课程讲师/机构': course ? course.instructor : '-',
        '课件数': totalCw,
        '学习进度': `${stats.completedCount}/${totalCw}`,
        '课程类型': course ? course.typeName : '-',
        '学习完成时间': stats.lastLearnTime || '-'
      };
    });
    this.exportToExcel(records, '学习的课程');
  }

  getFilteredMyFollowed() {
    const relations = TEACHER_COURSE_RELATIONS[this.currentUser.id] || [];
    let followed = relations.filter(r => r.followed).map(r => {
      const course = MOCK_COURSES.find(c => c.id === r.courseId);
      return { ...r, courseName: course ? course.name : '-', instructor: course ? course.instructor : '-', typeName: course ? course.typeName : '-', coursewareCount: this.getCoursewareCount(r.courseId) };
    });
    if (this.myFollowedFilterTypes.length > 0) {
      followed = followed.filter(r => {
        const course = MOCK_COURSES.find(c => c.id === r.courseId);
        return course && course.type && this.myFollowedFilterTypes.some(id => course.type.includes(id));
      });
    }
    if (this.myFollowedSearchKeyword) {
      const kw = this.myFollowedSearchKeyword.toLowerCase();
      followed = followed.filter(r => {
        const course = MOCK_COURSES.find(c => c.id === r.courseId);
        const nameMatch = course && course.name.toLowerCase().includes(kw);
        const instructorMatch = course && course.instructor.toLowerCase().includes(kw);
        const typeMatch = course && course.typeName && course.typeName.toLowerCase().includes(kw);
        return nameMatch || instructorMatch || typeMatch;
      });
    }
    return followed;
  }

  renderMyFollowed() {
    const followed = this.getFilteredMyFollowed();
    const start = (this.learningFollowedPage - 1) * this.learningFollowedPageSize;
    const pageList = followed.slice(start, start + this.learningFollowedPageSize);
    const tbody = document.querySelector('#learning-followed-table tbody');

    if (pageList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-secondary">暂无收藏的课程</td></tr>`;
      this.renderPagination('learning-followed-pagination', followed.length, this.learningFollowedPageSize, this.learningFollowedPage, (p) => {
        this.learningFollowedPage = p;
        this.renderMyFollowed();
      });
      return;
    }

    tbody.innerHTML = pageList.map((r, idx) => `
      <tr>
        <td>${start + idx + 1}</td>
        <td>${r.courseName}</td>
        <td>${r.instructor}</td>
        <td>${r.coursewareCount}</td>
        <td>${r.typeName}</td>
        <td>${r.followTime || '-'}</td>
        <td>
          <button class="btn btn-ghost btn-sm" onclick="app.unfollowCourse('${r.courseId}')">取消收藏</button>
          <button class="btn btn-primary btn-sm" onclick="app.goTo('course-detail', '${r.courseId}')">去学习</button>
        </td>
      </tr>
    `).join('');

    this.renderPagination('learning-followed-pagination', followed.length, this.learningFollowedPageSize, this.learningFollowedPage, (p) => {
      this.learningFollowedPage = p;
      this.renderMyFollowed();
    });
  }

  unfollowCourse(courseId) {
    this.showConfirm('取消收藏', '确定取消收藏该课程吗？', () => {
      const relations = TEACHER_COURSE_RELATIONS[this.currentUser.id] || [];
      const rel = relations.find(r => r.courseId === courseId);
      if (rel) {
        rel.followed = false;
        this.toast('已取消收藏', 'success');
        this.renderMyFollowed();
      }
    });
  }

  exportMyFollowedCourses() {
    const records = this.getFilteredMyFollowed().map((r, idx) => ({
      '序号': idx + 1,
      '课程名称': r.courseName,
      '课程讲师/机构': r.instructor,
      '课件数': r.coursewareCount,
      '课程类型': r.typeName,
      '收藏时间': r.followTime || '-'
    }));
    this.exportToExcel(records, '收藏的课程');
  }

  getFilteredMyReviews() {
    let myReviews = [];
    Object.entries(COURSE_REVIEWS).forEach(([courseId, reviews]) => {
      reviews.forEach(r => {
        if (r.teacherId === this.currentUser.id) {
          const course = MOCK_COURSES.find(c => c.id === courseId);
          myReviews.push({ ...r, courseId, courseName: course ? course.name : '-', instructor: course ? course.instructor : '-', typeName: course ? course.typeName : '-', coursewareCount: this.getCoursewareCount(courseId) });
        }
      });
    });
    myReviews.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));

    if (this.myReviewsFilterTypes.length > 0) {
      myReviews = myReviews.filter(r => {
        const course = MOCK_COURSES.find(c => c.id === r.courseId);
        return course && course.type && this.myReviewsFilterTypes.some(id => course.type.includes(id));
      });
    }
    if (this.myReviewsSearchKeyword) {
      const kw = this.myReviewsSearchKeyword.toLowerCase();
      myReviews = myReviews.filter(r => {
        const course = MOCK_COURSES.find(c => c.id === r.courseId);
        const nameMatch = course && course.name.toLowerCase().includes(kw);
        const instructorMatch = course && course.instructor.toLowerCase().includes(kw);
        const typeMatch = course && course.typeName && course.typeName.toLowerCase().includes(kw);
        return nameMatch || instructorMatch || typeMatch;
      });
    }
    return myReviews;
  }

  renderMyReviews() {
    const myReviews = this.getFilteredMyReviews();
    const start = (this.learningReviewsPage - 1) * this.learningReviewsPageSize;
    const pageList = myReviews.slice(start, start + this.learningReviewsPageSize);
    const tbody = document.querySelector('#learning-reviews-table tbody');

    if (pageList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-secondary">暂无评价记录</td></tr>`;
      this.renderPagination('learning-reviews-pagination', myReviews.length, this.learningReviewsPageSize, this.learningReviewsPage, (p) => {
        this.learningReviewsPage = p;
        this.renderMyReviews();
      });
      return;
    }

    tbody.innerHTML = pageList.map((r, idx) => `
      <tr>
        <td>${start + idx + 1}</td>
        <td>${r.courseName}</td>
        <td>${r.instructor}</td>
        <td>${r.coursewareCount}</td>
        <td>${r.typeName}</td>
        <td><span class="star-rating">${this.renderStars(r.rating)}</span> ${r.rating}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${r.content}">${r.content}</td>
        <td>${r.createTime}</td>
        <td><button class="btn btn-primary btn-sm" onclick="app.goTo('course-detail', '${r.courseId}')">去学习</button></td>
      </tr>
    `).join('');

    this.renderPagination('learning-reviews-pagination', myReviews.length, this.learningReviewsPageSize, this.learningReviewsPage, (p) => {
      this.learningReviewsPage = p;
      this.renderMyReviews();
    });
  }

  exportMyReviews() {
    const records = this.getFilteredMyReviews().map((r, idx) => ({
      '序号': idx + 1,
      '课程名称': r.courseName,
      '课程讲师/机构': r.instructor,
      '课件数': r.coursewareCount,
      '课程类型': r.typeName,
      '课程评星': r.rating,
      '评语内容': r.content,
      '评价时间': r.createTime
    }));
    this.exportToExcel(records, '评价的课程');
  }

  filterMyCourses() {
    this.myCoursesSearchKeyword = document.getElementById('my-courses-search').value.trim().toLowerCase();
    this.learningCoursesPage = 1;
    this.renderMyCourses();
  }

  filterMyFollowed() {
    this.myFollowedSearchKeyword = document.getElementById('my-followed-search').value.trim().toLowerCase();
    this.learningFollowedPage = 1;
    this.renderMyFollowed();
  }

  filterMyReviews() {
    this.myReviewsSearchKeyword = document.getElementById('my-reviews-search').value.trim().toLowerCase();
    this.learningReviewsPage = 1;
    this.renderMyReviews();
  }

  // ==================== Sub-tab Type Filters (Generic) ====================

  buildTypeOptionsHtml(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const buildOptions = (types, level = 0) => {
      let html = '';
      types.forEach(t => {
        const indent = level * 16;
        html += `
          <label class="multi-select-option" style="padding-left:${12 + indent}px">
            <input type="checkbox" value="${t.id}" data-name="${t.name}">
            <span>${t.name}</span>
          </label>`;
        if (t.children && t.children.length) {
          html += buildOptions(t.children, level + 1);
        }
      });
      return html;
    };
    container.innerHTML = buildOptions(MOCK_COURSE_TYPES);
  }

  toggleTypeDropdown(wrapperId, dropdownId, e) {
    e.stopPropagation();
    const dropdown = document.getElementById(dropdownId);
    dropdown.classList.toggle('active');
    if (dropdown.classList.contains('active')) {
      const closeHandler = (evt) => {
        const wrapper = document.getElementById(wrapperId);
        if (wrapper && !wrapper.contains(evt.target)) {
          dropdown.classList.remove('active');
        }
      };
      setTimeout(() => document.addEventListener('click', closeHandler, { once: true }), 0);
    }
  }

  filterTypeOptions(containerId, keyword) {
    const kw = keyword.toLowerCase();
    document.querySelectorAll(`#${containerId} .multi-select-option`).forEach(el => {
      const text = el.textContent.toLowerCase();
      el.style.display = text.includes(kw) ? 'flex' : 'none';
    });
  }

  updateTypeLabel(containerId, labelId) {
    const checked = Array.from(document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`));
    const label = document.getElementById(labelId);
    if (checked.length === 0) {
      label.textContent = '全部类型';
    } else if (checked.length <= 2) {
      label.textContent = checked.map(cb => cb.dataset.name).join('、');
    } else {
      label.textContent = `已选 ${checked.length} 项`;
    }
  }

  getSelectedTypeIds(containerId) {
    return Array.from(document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`)).map(cb => cb.value);
  }

  // Courses type filter
  initMyCoursesTypeOptions() {
    this.buildTypeOptionsHtml('my-courses-type-options');
    this.updateTypeLabel('my-courses-type-options', 'my-courses-type-label');
  }
  toggleMyCoursesTypeDropdown(e) { this.toggleTypeDropdown('my-courses-type-select', 'my-courses-type-dropdown', e); }
  filterMyCoursesTypeOptions(keyword) { this.filterTypeOptions('my-courses-type-options', keyword); }
  clearMyCoursesTypeSelection() {
    document.querySelectorAll('#my-courses-type-options input[type="checkbox"]').forEach(cb => cb.checked = false);
    this.updateTypeLabel('my-courses-type-options', 'my-courses-type-label');
    this.myCoursesFilterTypes = [];
    this.learningCoursesPage = 1;
    this.renderMyCourses();
    document.getElementById('my-courses-type-dropdown').classList.remove('active');
  }
  confirmMyCoursesTypeSelection() {
    document.getElementById('my-courses-type-dropdown').classList.remove('active');
    this.myCoursesFilterTypes = this.getSelectedTypeIds('my-courses-type-options');
    this.learningCoursesPage = 1;
    this.renderMyCourses();
  }

  // Followed type filter
  initMyFollowedTypeOptions() {
    this.buildTypeOptionsHtml('my-followed-type-options');
    this.updateTypeLabel('my-followed-type-options', 'my-followed-type-label');
  }
  toggleMyFollowedTypeDropdown(e) { this.toggleTypeDropdown('my-followed-type-select', 'my-followed-type-dropdown', e); }
  filterMyFollowedTypeOptions(keyword) { this.filterTypeOptions('my-followed-type-options', keyword); }
  clearMyFollowedTypeSelection() {
    document.querySelectorAll('#my-followed-type-options input[type="checkbox"]').forEach(cb => cb.checked = false);
    this.updateTypeLabel('my-followed-type-options', 'my-followed-type-label');
    this.myFollowedFilterTypes = [];
    this.learningFollowedPage = 1;
    this.renderMyFollowed();
    document.getElementById('my-followed-type-dropdown').classList.remove('active');
  }
  confirmMyFollowedTypeSelection() {
    document.getElementById('my-followed-type-dropdown').classList.remove('active');
    this.myFollowedFilterTypes = this.getSelectedTypeIds('my-followed-type-options');
    this.learningFollowedPage = 1;
    this.renderMyFollowed();
  }

  // Reviews type filter
  initMyReviewsTypeOptions() {
    this.buildTypeOptionsHtml('my-reviews-type-options');
    this.updateTypeLabel('my-reviews-type-options', 'my-reviews-type-label');
  }
  toggleMyReviewsTypeDropdown(e) { this.toggleTypeDropdown('my-reviews-type-select', 'my-reviews-type-dropdown', e); }
  filterMyReviewsTypeOptions(keyword) { this.filterTypeOptions('my-reviews-type-options', keyword); }
  clearMyReviewsTypeSelection() {
    document.querySelectorAll('#my-reviews-type-options input[type="checkbox"]').forEach(cb => cb.checked = false);
    this.updateTypeLabel('my-reviews-type-options', 'my-reviews-type-label');
    this.myReviewsFilterTypes = [];
    this.learningReviewsPage = 1;
    this.renderMyReviews();
    document.getElementById('my-reviews-type-dropdown').classList.remove('active');
  }
  confirmMyReviewsTypeSelection() {
    document.getElementById('my-reviews-type-dropdown').classList.remove('active');
    this.myReviewsFilterTypes = this.getSelectedTypeIds('my-reviews-type-options');
    this.learningReviewsPage = 1;
    this.renderMyReviews();
  }

  // ==================== Rankings ====================

  switchRankingTab(tab) {
    this.rankingTab = tab;
    document.querySelectorAll('#rankings-sidebar .tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    this.renderRankingList();
  }

  renderRankingList() {
    const container = document.getElementById('ranking-list-container');
    if (!container) return;
    let data = [];
    let valueHeader = '学习人数';
    if (this.rankingTab === 'rank-learn') {
      data = RANKINGS.learnTop5;
      valueHeader = '学习人数';
    } else if (this.rankingTab === 'rank-follow') {
      data = RANKINGS.followTop5;
      valueHeader = '收藏人数';
    } else if (this.rankingTab === 'rank-rating') {
      data = RANKINGS.ratingTop5;
      valueHeader = '评分';
    }

    const headerHtml = `
      <div class="ranking-header">
        <div class="col-rank">排名</div>
        <div class="col-name">课程名称</div>
        <div class="col-value">${valueHeader}</div>
      </div>
    `;

    container.innerHTML = headerHtml + data.map((item, idx) => {
      const rankCls = idx === 0 ? 'top1' : idx === 1 ? 'top2' : idx === 2 ? 'top3' : '';
      const valueLabel = this.rankingTab === 'rank-rating' ? item.value.toFixed(1) : item.value;
      return `
        <div class="ranking-item">
          <div class="ranking-rank ${rankCls}">${item.rank}</div>
          <div class="ranking-name" title="${item.name}">${item.name}</div>
          <div class="ranking-value">${valueLabel}</div>
        </div>
      `;
    }).join('');
  }

  renderTeacherRankings() {
    const container = document.getElementById('teacher-ranking-list');
    if (!container) return;
    const headerHtml = `
      <div class="ranking-header">
        <div class="col-rank">排序</div>
        <div class="col-name">教师</div>
        <div class="col-value">学习课件数</div>
      </div>
    `;
    container.innerHTML = headerHtml + RANKINGS.teacherTop5.map((item, idx) => {
      const rankCls = idx === 0 ? 'top1' : idx === 1 ? 'top2' : idx === 2 ? 'top3' : '';
      return `
        <div class="ranking-item">
          <div class="ranking-rank ${rankCls}">${item.rank}</div>
          <div class="ranking-name">${item.name}</div>
          <div class="ranking-value">${item.value}</div>
        </div>
      `;
    }).join('');
  }

  renderRankings() {
    document.querySelectorAll('#rankings-sidebar .tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === this.rankingTab);
    });
    this.renderRankingList();
    this.renderTeacherRankings();
  }

  // ==================== Space Tab Switching ====================

  switchSpaceTab(tab) {
    this.spaceTab = tab;
    document.querySelectorAll('.space-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.querySelectorAll('#page-teacher-space .tab-content').forEach(c => {
      c.classList.remove('active');
    });
    document.getElementById('space-tab-' + tab).classList.add('active');

    this.renderSpaceContent();
  }

  // ==================== Pagination ====================

  renderPagination(containerId, total, pageSize, currentPage, onChange) {
    const container = document.getElementById(containerId);
    const totalPages = Math.ceil(total / pageSize) || 1;
    let html = '';
    html += `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="${currentPage > 1 ? `(${onChange.toString()})(${currentPage - 1})` : ''}" ${currentPage === 1 ? 'disabled' : ''}">&#8249;</button>`;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="(${onChange.toString()})(${i})">${i}</button>`;
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        html += `<span class="page-btn" style="cursor:default;">...</span>`;
      }
    }
    html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="${currentPage < totalPages ? `(${onChange.toString()})(${currentPage + 1})` : ''}" ${currentPage === totalPages ? 'disabled' : ''}">&#8250;</button>`;
    container.innerHTML = html;
  }

  // ==================== Course Detail ====================

  renderCourseDetail() {
    const course = MOCK_COURSES.find(c => c.id === this.currentCourseId);
    if (!course) return;
    this.renderCourseDetailBreadcrumb(course);
    this.renderCourseDetailHeader(course);
    this.renderCourseDetailFeedbackTab();
    this.renderCourseAiAdvice(course);
    this.switchCourseDetailTab('intro');
  }

  renderCourseDetailFeedbackTab() {
    const feedbackTab = document.querySelector('#page-course-detail .tab[data-tab="feedback"]');
    const feedbackContent = document.getElementById('course-tab-feedback');
    if (!feedbackTab || !feedbackContent) return;
    const showFeedback = !!this.fromActivityId;
    feedbackTab.style.display = showFeedback ? '' : 'none';
    feedbackContent.style.display = showFeedback ? '' : 'none';
  }

  renderCourseDetailBreadcrumb(course) {
    const container = document.getElementById('course-detail-breadcrumb-container');
    let html = `<span class="breadcrumb-item" onclick="app.goTo('teacher-space')">培训空间</span>`;
    if (this.fromActivityId) {
      html += `<span class="breadcrumb-separator">/</span><span class="breadcrumb-item" onclick="app.goTo('activity-detail', '${this.fromActivityId}')">活动详情</span>`;
    }
    html += `<span class="breadcrumb-separator">/</span><span class="breadcrumb-item active">${course.name}</span>`;
    container.innerHTML = html;
  }

  renderCourseDetailHeader(course) {
    const reviews = COURSE_REVIEWS[course.id] || [];
    const reviewCount = reviews.length;
    const relation = (TEACHER_COURSE_RELATIONS[this.currentUser.id] || []).find(r => r.courseId === course.id);
    const isFollowed = relation ? relation.followed : false;

    const header = document.getElementById('course-detail-header');
    header.innerHTML = `
      <img src="${course.cover}" class="course-detail-cover" alt="${course.name}">
      <div class="course-detail-info">
        <div class="course-detail-title">${course.name}</div>
        <div class="course-detail-meta">
          <span class="star-rating">${this.renderStars(course.rating)}</span>
          <span>${course.rating || '0.0'} 分</span>
          <span>&#128172; ${reviewCount} 条评价</span>
        </div>
        <div class="course-detail-meta">${course.instructor}</div>
        <div class="course-detail-stats">
          <span>&#128221; ${course.sections} 课件</span>
          <span>&#128100; ${course.learners} 学习</span>
          <span>&#11088; ${this.getFollowCount(course.id)} 收藏</span>
        </div>
        <div class="mt-4">
          <button class="follow-btn ${isFollowed ? 'followed' : ''}" onclick="app.toggleFollowCourse('${course.id}')">
            ${isFollowed ? '&#10003; 已收藏' : '&#43; 收藏课程'}
          </button>
        </div>
      </div>
    `;
  }

  getFollowCount(courseId) {
    let count = 0;
    Object.values(TEACHER_COURSE_RELATIONS).forEach(relations => {
      relations.forEach(r => {
        if (r.courseId === courseId && r.followed) count++;
      });
    });
    return count;
  }

  toggleFollowCourse(courseId) {
    let relations = TEACHER_COURSE_RELATIONS[this.currentUser.id];
    if (!relations) {
      relations = [];
      TEACHER_COURSE_RELATIONS[this.currentUser.id] = relations;
    }
    let relation = relations.find(r => r.courseId === courseId);
    if (!relation) {
      relation = { courseId, enrolled: false, followed: true, progress: 0, lastLearnTime: '-', earnedHours: 0 };
      relations.push(relation);
    } else {
      relation.followed = !relation.followed;
    }
    this.renderCourseDetailHeader(MOCK_COURSES.find(c => c.id === courseId));
    this.toast(relation.followed ? '收藏成功' : '已取消收藏', 'success');
  }

  switchCourseDetailTab(tab) {
    const feedbackTab = document.querySelector('#page-course-detail .tab[data-tab="feedback"]');
    if (tab === 'feedback' && feedbackTab && feedbackTab.style.display === 'none') {
      tab = 'intro';
    }
    document.querySelectorAll('#page-course-detail .tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.querySelectorAll('#page-course-detail .tab-content').forEach(c => {
      c.classList.remove('active');
    });
    document.getElementById('course-tab-' + tab).classList.add('active');

    const course = MOCK_COURSES.find(c => c.id === this.currentCourseId);
    if (!course) return;
    if (tab === 'intro') {
      const introContent = course.description ? '<div class="course-intro-section">' + course.description + '</div>' : '';
      document.getElementById('course-intro-content').innerHTML = introContent || '<div class="course-intro-empty">暂无课程简介</div>';
    } else if (tab === 'catalog') {
      this.renderCourseCatalog(course);
    } else if (tab === 'reviews') {
      this.renderCourseReviews(course);
    } else if (tab === 'ai-advice') {
      this.renderCourseAiAdvice(course);
    } else if (tab === 'feedback') {
      this.renderCourseFeedback(course);
    }
  }

  renderCourseCatalog(course) {
    const catalog = MOCK_COURSE_CATALOG[course.id];
    const container = document.getElementById('course-catalog-content');
    if (!catalog || !catalog.chapters || catalog.chapters.length === 0) {
      container.innerHTML = `<div class="empty-state"><div style="font-size:48px;margin-bottom:12px;">&#128218;</div><div>暂无课程目录</div></div>`;
      return;
    }

    const learnedIds = new Set();
    const records = TEACHER_LEARNING_RECORDS[this.currentUser.id] || [];
    records.forEach(r => { if (r.completed) learnedIds.add(r.coursewareId); });

    const typeLabels = { video: '视频', text: '图文', document: '文档' };

    container.innerHTML = catalog.chapters.map(ch => `
      <div class="mb-4">
        <div class="chapter-node">${ch.name}</div>
        <div class="pl-3">
          ${(ch.children || []).map(cw => {
            const isLearned = learnedIds.has(cw.id);
            const typeLabel = typeLabels[cw.type] || '图文';
            return `
              <div class="courseware-node ${isLearned ? 'completed' : ''}" onclick="app.enterCourseware('${course.id}', '${cw.id}')">
                <span class="cw-tag ${isLearned ? 'status-learned' : 'status-unlearned'}">${isLearned ? '已学' : '未学'}</span>
                <span class="cw-tag type-${cw.type || 'text'}">${typeLabel}</span>
                ${cw.materials > 0 ? `<span class="cw-tag material-count">&#128206; ${cw.materials}</span>` : ''}
                <span class="cw-name">${cw.name}</span>
                ${isLearned ? '<span class="node-status">&#10003;</span>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');
  }

  // ==================== Course Reviews ====================

  renderCourseReviews(course) {
    const container = document.getElementById('course-reviews-content');
    const reviews = COURSE_REVIEWS[course.id] || [];
    const myReview = reviews.find(r => r.teacherId === this.currentUser.id);

    // Rating summary
    const total = reviews.length;
    const avg = total > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1) : '0.0';
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { dist[r.rating] = (dist[r.rating] || 0) + 1; });

    let summaryHtml = `
      <div class="rating-summary">
        <div class="rating-score">
          <div class="score">${avg}</div>
          <div class="star-rating" style="justify-content:center;">${this.renderStars(parseFloat(avg))}</div>
          <div class="total">共 ${total} 条评价</div>
        </div>
        <div class="rating-bars">
          ${[5, 4, 3, 2, 1].map(star => {
            const pct = total > 0 ? (dist[star] / total * 100).toFixed(0) : 0;
            return `
              <div class="rating-bar-row">
                <span class="label">${star}星</span>
                <div class="rating-bar-track"><div class="rating-bar-fill" style="width:${pct}%"></div></div>
                <span class="count">${dist[star]}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // My review action
    let actionHtml = '';
    if (!myReview) {
      actionHtml = `<div class="mb-4"><button class="btn btn-primary" onclick="app.openReviewModal('${course.id}')">提交评价</button></div>`;
    }

    // Review list
    let listHtml = '';
    if (reviews.length === 0) {
      listHtml = `<div class="empty-state"><div style="font-size:48px;margin-bottom:12px;">&#128172;</div><div>暂无评价</div></div>`;
    } else {
      listHtml = reviews.sort((a, b) => new Date(b.createTime) - new Date(a.createTime)).map(r => {
        const isMine = r.teacherId === this.currentUser.id;
        const name = r.anonymous ? '******' : r.teacherName;
        const avatarText = r.anonymous ? '*' : (r.teacherName ? r.teacherName.charAt(0) : '?');
        return `
          <div class="review-card">
            <div class="review-card-header">
              <div class="review-avatar">${avatarText}</div>
              <div class="review-info">
                <div class="review-name">${name} ${isMine ? '(我)' : ''}</div>
                <div class="star-rating">${this.renderStars(r.rating)}</div>
              </div>
              <div class="review-time">${r.createTime}</div>
            </div>
            <div class="review-content">${r.content}</div>
            <div class="review-footer">
              <div class="review-actions">
                <button onclick="app.likeReview('${course.id}', '${r.id}')" style="${this.likedReviewIds.has(`${course.id}-${r.id}`) ? 'color:var(--primary);font-weight:600;' : ''}">&#128077; ${r.likes}</button>
              </div>
              ${isMine ? `
                <div class="review-actions">
                  <button onclick="app.openReviewModal('${course.id}', '${r.id}')">编辑</button>
                  <button onclick="app.confirmDeleteReview('${course.id}', '${r.id}')">删除</button>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    container.innerHTML = summaryHtml + actionHtml + listHtml;
  }

  likeReview(courseId, reviewId) {
    const reviews = COURSE_REVIEWS[courseId];
    if (!reviews) return;
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;
    const key = `${courseId}-${reviewId}`;
    if (this.likedReviewIds.has(key)) {
      this.likedReviewIds.delete(key);
      review.likes = Math.max(0, review.likes - 1);
    } else {
      this.likedReviewIds.add(key);
      review.likes++;
    }
    this.renderCourseReviews(MOCK_COURSES.find(c => c.id === courseId));
  }

  // ==================== Review Modal ====================

  openReviewModal(courseId, reviewId = null) {
    this.currentCourseId = courseId;
    this.editingReviewId = reviewId;
    const reviews = COURSE_REVIEWS[courseId] || [];
    const review = reviewId ? reviews.find(r => r.id === reviewId) : null;

    document.getElementById('review-modal-title').textContent = reviewId ? '编辑评价' : '提交评价';
    this.setReviewRating(review ? review.rating : 0);
    document.getElementById('review-content-input').value = review ? review.content : '';
    document.getElementById('review-anonymous-input').checked = review ? review.anonymous : false;
    this.updateReviewCharCount();
    this.openModal('modal-review-submit');
  }

  setReviewRating(val) {
    this.reviewRating = val;
    document.querySelectorAll('#review-star-input .star').forEach((star, idx) => {
      star.classList.toggle('active', idx < val);
    });
  }

  hoverReviewRating(val) {
    document.querySelectorAll('#review-star-input .star').forEach((star, idx) => {
      star.classList.toggle('hovered', idx < val);
    });
  }

  resetReviewHover() {
    document.querySelectorAll('#review-star-input .star').forEach((star, idx) => {
      star.classList.remove('hovered');
      star.classList.toggle('active', idx < this.reviewRating);
    });
  }

  updateReviewCharCount() {
    const len = document.getElementById('review-content-input').value.length;
    document.getElementById('review-char-count').textContent = len;
  }

  submitReview() {
    const content = document.getElementById('review-content-input').value.trim();
    const anonymous = document.getElementById('review-anonymous-input').checked;

    if (this.reviewRating === 0) {
      this.toast('请选择评分', 'warning');
      return;
    }
    if (!content) {
      this.toast('请输入评价内容', 'warning');
      return;
    }

    let reviews = COURSE_REVIEWS[this.currentCourseId];
    if (!reviews) {
      reviews = [];
      COURSE_REVIEWS[this.currentCourseId] = reviews;
    }

    if (this.editingReviewId) {
      const review = reviews.find(r => r.id === this.editingReviewId);
      if (review) {
        review.rating = this.reviewRating;
        review.content = content;
        review.anonymous = anonymous;
      }
      this.toast('评价已更新', 'success');
    } else {
      const newReview = {
        id: 'r' + Date.now(),
        teacherId: this.currentUser.id,
        teacherName: this.currentUser.name,
        avatar: this.currentUser.avatar,
        rating: this.reviewRating,
        content,
        anonymous,
        createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
        likes: 0
      };
      reviews.push(newReview);
      this.toast('评价提交成功', 'success');
    }

    this.closeModal('modal-review-submit');
    this.renderCourseReviews(MOCK_COURSES.find(c => c.id === this.currentCourseId));
    this.renderCourseDetailHeader(MOCK_COURSES.find(c => c.id === this.currentCourseId));
  }

  confirmDeleteReview(courseId, reviewId) {
    this.showConfirm('删除评价', '确定要删除这条评价吗？', () => {
      const reviews = COURSE_REVIEWS[courseId];
      if (reviews) {
        const idx = reviews.findIndex(r => r.id === reviewId);
        if (idx > -1) {
          reviews.splice(idx, 1);
          this.toast('评价已删除', 'success');
          this.renderCourseReviews(MOCK_COURSES.find(c => c.id === courseId));
          this.renderCourseDetailHeader(MOCK_COURSES.find(c => c.id === courseId));
        }
      }
    });
  }

  // ==================== Course Feedback ====================

  renderCourseFeedback(course) {
    const container = document.getElementById('course-feedback-container');
    const existing = this.courseFeedbacks[course.id];
    if (existing && this.editingCourseFeedbackId !== course.id) {
      container.innerHTML = `
        <div class="card mb-4" style="background:#F5F5F4;">
          <div class="card-body">
            <div class="text-sm text-secondary mb-2">学习心得内容</div>
            <div class="text-sm leading-relaxed mb-4" style="white-space:pre-wrap;">${existing.content}</div>
            ${existing.fileName ? `
              <div class="flex items-center gap-2 text-sm text-secondary">
                <span>&#128206;</span>
                <span>${existing.fileName}</span>
              </div>
            ` : ''}
            <div class="text-xs text-tertiary mt-3">提交时间：${existing.submitTime}</div>
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:12px;">
          <button class="btn btn-secondary" onclick="app.editCourseFeedback('${course.id}')">编辑</button>
        </div>
      `;
      return;
    }

    const editContent = existing ? existing.content : '';
    const editFileName = existing ? existing.fileName : '';
    container.innerHTML = `
      <div class="form-group">
        <label class="form-label">学习心得内容 <span class="required">*</span></label>
        <textarea id="course-feedback-textarea" class="form-textarea" rows="6" maxlength="500" placeholder="请输入您的学习心得，最多500字">${editContent}</textarea>
        <div class="text-right text-xs text-tertiary mt-1"><span id="course-feedback-char-count">${editContent.length}</span>/500</div>
      </div>
      <div class="form-group">
        <label class="form-label">上传附件</label>
        <div class="file-upload" id="course-feedback-file-area" onclick="document.getElementById('course-feedback-file-input').click()">
          <input type="file" id="course-feedback-file-input" style="display:none;" onchange="app.handleCourseFeedbackFile(this)">
          <div style="font-size:28px;margin-bottom:8px;">&#128206;</div>
          <div class="text-sm text-secondary">点击上传附件</div>
          <div class="text-xs text-tertiary mt-1">支持 Word、PDF、图片等格式</div>
        </div>
        <div id="course-feedback-file-name" class="text-sm text-secondary mt-2" style="display:${editFileName ? 'block' : 'none'};">${editFileName ? '已选择：' + editFileName : ''}</div>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:12px;">
        ${existing ? `<button class="btn btn-ghost" onclick="app.cancelEditCourseFeedback('${course.id}')">取消</button>` : ''}
        <button class="btn btn-primary" onclick="app.submitCourseFeedback('${course.id}')">提交学习心得</button>
      </div>
    `;
    const textarea = document.getElementById('course-feedback-textarea');
    if (textarea) {
      textarea.addEventListener('input', () => {
        const len = document.getElementById('course-feedback-textarea').value.length;
        document.getElementById('course-feedback-char-count').textContent = len;
      });
    }
  }

  handleCourseFeedbackFile(input) {
    const file = input.files[0];
    if (file) {
      const nameEl = document.getElementById('course-feedback-file-name');
      nameEl.textContent = '已选择：' + file.name;
      nameEl.style.display = 'block';
    }
  }

  editCourseFeedback(courseId) {
    this.editingCourseFeedbackId = courseId;
    this.renderCourseFeedback(MOCK_COURSES.find(c => c.id === courseId));
  }

  cancelEditCourseFeedback(courseId) {
    this.editingCourseFeedbackId = null;
    this.renderCourseFeedback(MOCK_COURSES.find(c => c.id === courseId));
  }

  submitCourseFeedback(courseId) {
    const content = document.getElementById('course-feedback-textarea').value.trim();
    if (!content) {
      this.toast('请输入学习心得内容', 'warning');
      return;
    }
    const fileInput = document.getElementById('course-feedback-file-input');
    const fileName = fileInput && fileInput.files[0] ? fileInput.files[0].name : (this.courseFeedbacks[courseId]?.fileName || '');
    this.showConfirm('提交学习心得', '提交后将无法撤回内容！', () => {
      this.courseFeedbacks[courseId] = {
        content,
        fileName,
        submitTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      this.editingCourseFeedbackId = null;
      this.toast('学习心得提交成功', 'success');
      this.renderCourseFeedback(MOCK_COURSES.find(c => c.id === courseId));
    });
  }

  // ==================== AI Course Advice ====================

  renderCourseAiAdvice(course) {
    const container = document.getElementById('course-ai-advice-content');
    if (!container) return;

    // AI根据课程名称和课件内容生成知识图谱知识点
    const catalog = MOCK_COURSE_CATALOG[course.id];
    const coursewareNames = [];
    if (catalog && catalog.chapters) {
      catalog.chapters.forEach(ch => {
        (ch.children || []).forEach(cw => {
          coursewareNames.push(cw.name);
        });
      });
    }
    // 从课件名称中提取知识点（取前6个课件名称作为知识点节点，名称过长时截取关键词）
    const knowledgeGraph = coursewareNames.length > 0
      ? coursewareNames.slice(0, 6).map(n => n.length > 8 ? n.slice(0, 7) + '…' : n)
      : ['知识模块A', '知识模块B', '知识模块C'];

    // AI根据课程内容生成结构化建议
    const coreValue = '《' + course.name + '》聚焦' + (course.typeName || '教师专业发展') + '领域，旨在帮助教师系统掌握核心概念与实践方法。';
    const keyDifficulties = '课程重难点在于理论与实践的有效结合。建议教师带着问题学习，边学边用。';
    const tieredAdvice = '【新教师】重点掌握基础概念；【骨干教师】关注方法迁移；【资深教师】聚焦前沿理念与深度反思。';

    const graphHtml = '<div class="ai-knowledge-graph"><div class="ai-knowledge-title">📚 知识图谱</div><div id="course-knowledge-graph" style="height: 280px;"></div><div id="knowledge-related-courseware" style="display:none;margin-top:12px;"></div></div>';

    const moduleHtml = (num, title, content) => '<div class="course-ai-advice-module"><div class="course-ai-advice-module-header"><span class="course-ai-advice-module-num">' + num + '</span><span class="course-ai-advice-module-title">' + title + '</span></div><div class="course-ai-advice-module-body">' + content.replace(/\\n/g, '<br>') + '</div></div>';

    container.innerHTML = '<div class="course-ai-advice-container"><div class="course-ai-advice-header"><div class="course-ai-advice-title">AI学习指引</div><div class="course-ai-advice-subtitle">根据《' + course.name + '》内容，为您生成专属研修学习建议</div></div><div class="course-ai-advice-modules">' +
      graphHtml +
      moduleHtml(1, '课程核心价值与教师研修目标', coreValue) +
      moduleHtml(2, '课程重难点与教师研修常见误区', keyDifficulties) +
      moduleHtml(3, '分层研修适配建议', tieredAdvice) +
      '</div></div>';

    // Render knowledge graph using ECharts
    const graphChartEl = document.getElementById('course-knowledge-graph');
    if (graphChartEl && window.echarts) {
      if (graphChartEl._echartsInstance) {
        graphChartEl._echartsInstance.dispose();
      }
      const graphChart = echarts.init(graphChartEl);
      graphChartEl._echartsInstance = graphChart;
      const nodes = [
        { id: 'center', name: course.name, value: 100, symbolSize: 75, itemStyle: { color: '#C8000C', shadowBlur: 15, shadowColor: 'rgba(200,0,12,0.3)' }, label: { fontSize: 14, fontWeight: 600, color: '#fff', formatter: function(p){return p.name.length>8?p.name.slice(0,7)+'…':p.name;} } },
        ...knowledgeGraph.map((k, i) => ({
          id: 'node' + i,
          name: k,
          value: 50,
          symbolSize: 48,
          itemStyle: { color: ['#78716C', '#A8A29E', '#57534E', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#D97706'][i % 8] },
          label: { fontSize: 12, color: '#fff', formatter: function(p){return p.name.length>6?p.name.slice(0,5)+'…':p.name;} }
        }))
      ];
      const links = knowledgeGraph.map((k, i) => ({ source: 'center', target: 'node' + i }));
      // Add cross-links between peripheral nodes to form a mesh network
      for (let i = 0; i < knowledgeGraph.length; i++) {
        for (let j = i + 1; j < knowledgeGraph.length; j++) {
          if ((i + j) % 3 === 0 && Math.abs(i - j) <= 4) {
            links.push({ source: 'node' + i, target: 'node' + j, lineStyle: { color: '#F5F5F4', width: 1 } });
          }
        }
      }
      graphChart.setOption({
        tooltip: { trigger: 'item' },
        animationDuration: 1000,
        animationEasingUpdate: 'quinticInOut',
        series: [{
          type: 'graph',
          layout: 'force',
          roam: true,
          label: { show: true, position: 'inside' },
          edgeSymbol: ['none', 'none'],
          edgeLabel: { show: false },
          data: nodes,
          links: links,
          force: { repulsion: 800, edgeLength: 120, gravity: 0.03 },
          lineStyle: { color: '#E7E5E4', width: 2, curveness: 0.1 },
          emphasis: { focus: 'adjacency', lineStyle: { width: 4, color: '#C8000C' } }
        }]
      });
      // Click event: show related courseware resources
      graphChart.on('click', (params) => {
        if (params.dataType === 'node' && params.data.id !== 'center') {
          const relatedContainer = document.getElementById('knowledge-related-courseware');
          if (!relatedContainer) return;
          const catalog = MOCK_COURSE_CATALOG[course.id];
          const coursewares = [];
          if (catalog && catalog.chapters) {
            catalog.chapters.forEach(ch => {
              (ch.children || []).forEach(cw => {
                if (cw.name.includes(params.data.name) || params.data.name.includes(cw.name)) {
                  coursewares.push({ ...cw, chapterName: ch.name });
                }
              });
            });
          }
          if (coursewares.length === 0) {
            // Fallback: show first 3 coursewares as related
            catalog.chapters.forEach(ch => {
              (ch.children || []).slice(0, 2).forEach(cw => {
                coursewares.push({ ...cw, chapterName: ch.name });
              });
            });
          }
          relatedContainer.style.display = 'block';
          relatedContainer.innerHTML = `
            <div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:8px;">📖 「${params.data.name}」关联课件资源</div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${coursewares.slice(0, 4).map(cw => `
                <div class="courseware-node" style="cursor:pointer;" onclick="app.enterCourseware('${course.id}', '${cw.id}')">
                  <span class="cw-tag type-${cw.type || 'text'}">${cw.type === 'video' ? '视频' : cw.type === 'document' ? '文档' : '图文'}</span>
                  <span class="cw-name">${cw.name}</span>
                  <span style="margin-left:auto;font-size:12px;color:var(--text-tertiary);">${cw.chapterName}</span>
                </div>
              `).join('')}
            </div>
          `;
        }
      });
    }
  }

  getAiOverallComment(totalScore) {
    let level, color, suggestion;
    if (totalScore >= 80) {
      level = '优秀';
      color = 'var(--success)';
      suggestion = '您的综合能力表现优异，建议继续保持学习节奏，同时发挥引领示范作用，带动教研组共同进步。';
    } else if (totalScore >= 60) {
      level = '良好';
      color = 'var(--success)';
      suggestion = '您的综合能力表现良好，在保持优势的基础上，建议针对性提升薄弱维度，实现更均衡的发展。';
    } else {
      level = '待提升';
      color = 'var(--danger)';
      suggestion = '您的综合能力尚有较大提升空间，建议制定系统性的学习计划，优先补强核心能力维度。';
    }
    return '<span style="color:' + color + ';font-weight:600;">💬 AI点评：综合评分' + totalScore + '分，' + level + '。</span> ' + suggestion;
  }

  getDimensionStrengthComment(name, score) {
    const map = {
      '课堂互动': '课堂互动能力突出，善于运用提问和讨论激发学生参与。建议继续保持并尝试跨学科融合互动模式，进一步提升课堂互动深度。',
      '新课标解读': '对新课标理解深入，能够准确把握核心素养要求。建议在教研活动中分享解读经验，带动更多教师共同提升。',
      '信息化教学': '信息化工具使用熟练，融合教学能力较强。建议探索AI辅助教学等前沿技术，深化信息技术与学科教学的融合创新。',
      '班级管理': '班级管理经验丰富，师生关系和谐。建议总结管理方法论，形成可复制的班级管理经验，供其他教师参考借鉴。',
      '作业设计': '作业设计有层次，能有效巩固和拓展学习。建议进一步研究分层作业与个性化学习反馈的结合，提升作业的精准度和有效性。',
      '教学研究': '具备较强的教研意识和反思能力。建议参与更高层级的课题研究，将教学反思转化为学术成果。',
      '师德修养': '师德修养扎实，以身作则，为学生树立了良好的榜样。建议在师德师风建设中发挥带头作用，分享师德践行经验。',
      '课程设计': '课程设计思路清晰，目标明确。建议关注跨学科课程整合，丰富课程设计的维度和创新性。',
      '评价反馈': '评价反馈及时有效，能够帮助学生明确改进方向。建议探索多元化评价方式，如表现性评价、成长档案袋等。',
      '学生发展': '关注学生全面发展，能够因材施教。建议进一步研究学生发展心理学，提升对特殊需求学生的教育支持能力。',
      '家校沟通': '家校沟通渠道畅通，家长满意度较高。建议建立系统化的家校共育机制，定期组织家校交流活动。',
      '教研引领': '教研组织能力较强，能够有效引领教研组开展活动。建议提升教研成果的辐射影响力，争取更高层级的教研示范机会。',
    };
    return map[name] || '该维度表现良好，继续保持并寻求进一步提升。';
  }

  getDimensionWeaknessComment(name, score) {
    const map = {
      '课堂互动': '课堂互动形式较为单一，小组合作学习组织不足。建议优先学习互动教学相关课程，从提问技巧和小组活动设计入手，逐步提升课堂互动质量。',
      '新课标解读': '对新课标理念理解停留在表面，缺乏系统性学习。建议系统学习新课标解读课程，结合自身学科特点，制定课标落地的具体行动计划。',
      '信息化教学': '信息化工具使用停留在基础层面，创新应用不足。建议从智慧课堂基础课程开始学习，每周尝试1个新的信息化教学工具或方法。',
      '班级管理': '班级管理方法传统，应对突发事件能力有待提升。建议优先学习《班级管理策略与技巧》课程，从规则建立与师生关系营造入手，逐步提升管理效能。',
      '作业设计': '作业设计缺乏分层，评价反馈不够及时具体。建议学习分层作业设计方法，尝试为每节课设计基础版、提高版、拓展版三级作业。',
      '教学研究': '教研参与度低，教学反思深度不够。建议每周撰写1篇教学反思笔记，积极参与教研组活动，逐步提升教研意识和能力。',
      '师德修养': '师德修养方面有待加强，建议学习新时代教师职业道德规范课程，在日常教学中注重言传身教。',
      '课程设计': '课程设计缺乏系统性，目标与评价衔接不够紧密。建议学习课程设计方法论，从教学目标的精准设定开始改进。',
      '评价反馈': '评价方式较为单一，以分数为主。建议学习多元评价理论与实践课程，尝试引入过程性评价和表现性评价。',
      '学生发展': '对学生个性化发展关注不足，指导缺乏针对性。建议学习学生发展心理学，建立学生成长档案，跟踪个体发展轨迹。',
      '家校沟通': '家校沟通频次低，方式单一。建议建立定期沟通机制，利用线上线下结合的方式提升家校互动质量。',
      '教研引领': '教研参与被动，缺乏主动引领意识。建议从小型教研分享开始，逐步承担教研组织角色，提升教研领导力。',
    };
    return map[name] || '该维度存在提升空间，建议针对性学习相关课程，制定改进计划。';
  }

  // ==================== AI Agent ====================

  openAiAgentSidebar() {
    this.aiSidebarOpen = true;
    document.getElementById('ai-agent-wrapper').classList.add('open');
    document.getElementById('ai-float-btn').style.display = 'none';
    if (!this.currentAiChatId || !this.aiChats[this.currentAiChatId]) {
      this.newAiChat();
    } else {
      this.renderAiChat();
    }
    this.renderAiHistory();
  }

  closeAiAgentSidebar() {
    this.aiSidebarOpen = false;
    this.aiHistoryOpen = false;
    document.getElementById('ai-agent-wrapper').classList.remove('open');
    document.getElementById('ai-agent-history-outer').classList.remove('open');
    document.getElementById('ai-float-btn').style.display = 'flex';
  }

  toggleAiHistory() {
    this.aiHistoryOpen = !this.aiHistoryOpen;
    const historyPanel = document.getElementById('ai-agent-history-outer');
    historyPanel.classList.toggle('open', this.aiHistoryOpen);
    if (this.aiHistoryOpen) this.renderAiHistory();
  }

  newAiChat() {
    const chatId = 'chat_' + Date.now();
    const course = MOCK_COURSES.find(c => c.id === this.currentCourseId);
    this.aiChats[chatId] = {
      id: chatId,
      title: '新对话',
      courseId: this.currentCourseId,
      courseName: course ? course.name : '',
      messages: [],
      createTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
    this.currentAiChatId = chatId;
    this.aiHistoryOpen = false;
    document.getElementById('ai-agent-history-outer').classList.remove('open');
    this.renderAiChat();
    this.renderAiHistory();
  }

  switchAiChat(chatId) {
    if (!this.aiChats[chatId]) return;
    this.currentAiChatId = chatId;
    this.aiHistoryOpen = false;
    document.getElementById('ai-agent-history-outer').classList.remove('open');
    this.renderAiChat();
  }

  deleteAiChat(chatId, event) {
    if (event) event.stopPropagation();
    if (Object.keys(this.aiChats).length <= 1) {
      this.toast('至少保留一个对话', 'warning');
      return;
    }
    delete this.aiChats[chatId];
    if (this.currentAiChatId === chatId) {
      const remaining = Object.keys(this.aiChats);
      this.currentAiChatId = remaining[0];
    }
    this.renderAiChat();
    this.renderAiHistory();
  }

  renderAiChat() {
    const chat = this.aiChats[this.currentAiChatId];
    const container = document.getElementById('ai-agent-chat-messages');
    if (!container) return;

    const course = chat && chat.courseId ? MOCK_COURSES.find(c => c.id === chat.courseId) : null;
    const messages = chat ? chat.messages : [];

    let messagesHtml = '';
    if (messages.length === 0) {
      messagesHtml = `
        <div class="ai-welcome">
          <div style="font-size:48px;margin-bottom:12px;">&#129302;</div>
          <div class="ai-welcome-title">AI研训助手</div>
          <div class="ai-welcome-desc">我是您的AI研训助手，可以针对《${course ? course.name : '课程名称'}》的课件资源进行智能问答。</div>
          <div class="ai-suggestions">
            <div class="ai-suggestion-item" onclick="app.quickAsk('请帮我总结本课程的核心知识点')">
              <span>&#128161;</span> 总结本课程核心知识点
            </div>
            <div class="ai-suggestion-item" onclick="app.quickAsk('本课程有哪些重点需要特别关注')">
              <span>&#127919;</span> 本课程重点难点
            </div>
            <div class="ai-suggestion-item" onclick="app.quickAsk('请帮我梳理本课程的章节结构')">
              <span>&#128218;</span> 梳理章节结构
            </div>
          </div>
        </div>
      `;
    } else {
      messagesHtml = messages.map((msg) => {
        if (msg.role === 'user') {
          return `<div class="ai-message ai-message-user"><div class="ai-message-content">${msg.content}</div></div>`;
        } else {
          return `<div class="ai-message ai-message-ai"><div class="ai-message-avatar">&#129302;</div><div class="ai-message-content">${msg.content}</div></div>`;
        }
      }).join('');
    }

    container.innerHTML = messagesHtml;
    container.scrollTop = container.scrollHeight;
  }

  renderAiHistory() {
    const listEl = document.getElementById('ai-agent-history-list');
    if (!listEl) return;
    const chats = Object.values(this.aiChats).sort((a, b) => b.id.localeCompare(a.id));
    if (chats.length === 0) {
      listEl.innerHTML = '<div class="ai-agent-history-empty">暂无历史对话</div>';
      return;
    }
    listEl.innerHTML = chats.map(chat => `
      <div class="ai-agent-history-item ${chat.id === this.currentAiChatId ? 'active' : ''}" onclick="app.switchAiChat('${chat.id}')">
        <div class="ai-agent-history-icon">&#128172;</div>
        <div class="ai-agent-history-info">
          <div class="ai-agent-history-title-text">${chat.title}</div>
          <div class="ai-agent-history-meta">${chat.createTime}</div>
        </div>
        <button class="ai-agent-history-delete" onclick="app.deleteAiChat('${chat.id}', event)" title="删除">&#128465;</button>
      </div>
    `).join('');
  }

  updateAiChatTitle(chatId, firstMessage) {
    const chat = this.aiChats[chatId];
    if (!chat || chat.title !== '新对话') return;
    const title = firstMessage.length > 12 ? firstMessage.slice(0, 12) + '...' : firstMessage;
    chat.title = title;
  }

  quickAsk(text) {
    const input = document.getElementById('ai-agent-input');
    if (input) input.value = text;
    this.sendAiQuestion();
  }

  sendAiQuestion() {
    const input = document.getElementById('ai-agent-input');
    const text = input.value.trim();
    if (!text) return;

    // ensure current chat exists
    if (!this.currentAiChatId || !this.aiChats[this.currentAiChatId]) {
      this.newAiChat();
    }

    const chat = this.aiChats[this.currentAiChatId];
    chat.messages.push({ role: 'user', content: text });
    if (chat.title === '新对话') this.updateAiChatTitle(chat.id, text);
    input.value = '';
    this.renderAiChat();
    this.renderAiHistory();

    // mock AI response
    setTimeout(() => {
      const reply = this.getAiMockReply(text);
      chat.messages.push({ role: 'ai', content: reply });
      this.renderAiChat();
    }, 800);
  }

  getAiMockReply(question) {
    const course = MOCK_COURSES.find(c => c.id === this.currentCourseId);
    const courseName = course ? course.name : '本课程';
    const lower = question.toLowerCase();
    if (lower.includes('总结') || lower.includes('核心') || lower.includes('知识点')) {
      return `《${courseName}》的核心知识点包括：<br><br>1. <strong>理论基础</strong>：系统阐述了相关领域的基本概念与原理。<br>2. <strong>实践方法</strong>：提供了可操作的教学策略与技巧。<br>3. <strong>案例分析</strong>：通过真实教学场景帮助理解理论应用。<br>4. <strong>反思提升</strong>：引导教师进行自我评估与持续改进。<br><br>建议您结合课件中的具体案例进行深入学习。`;
    }
    if (lower.includes('重点') || lower.includes('难点') || lower.includes('关注')) {
      return `《${courseName}》的重点与难点如下：<br><br><strong>重点：</strong><br>• 理论框架的整体把握<br>• 实践策略的灵活运用<br>• 教学评价的科学设计<br><br><strong>难点：</strong><br>• 理论与实践的有机结合<br>• 不同学情下的策略调整<br>• 教学反思的深度与广度<br><br>建议重点学习第二章和第三章的内容。`;
    }
    if (lower.includes('结构') || lower.includes('章节') || lower.includes('目录')) {
      const catalog = MOCK_COURSE_CATALOG[this.currentCourseId];
      if (catalog && catalog.chapters) {
        const chs = catalog.chapters.map((ch, i) => `${i + 1}. ${ch.name}`).join('<br>');
        return `《${courseName}》的章节结构如下：<br><br>${chs}<br><br>每个章节包含多个课件，涵盖了理论讲解、案例分析和实践指导等内容。`;
      }
      return `《${courseName}》的课程结构完整，包含理论篇、实践篇和拓展篇三大部分，建议按顺序学习。`;
    }
    if (lower.includes('解读') || lower.includes('课件')) {
      return `该课件的主要内容包括：<br><br>1. <strong>知识要点</strong>：详细讲解了核心概念与原理。<br>2. <strong>案例分析</strong>：通过典型案例帮助理解抽象理论。<br>3. <strong>实践指导</strong>：提供了具体的操作步骤与注意事项。<br><br>建议您在观看课件时做好笔记，并结合自身教学实际进行思考。`;
    }
    return `感谢您的提问！关于《${courseName}》的这个问题，我建议您：<br><br>1. 仔细回顾课程课件中的相关内容。<br>2. 结合课程评价区其他教师的讨论进行思考。<br>3. 如有疑问，可以通过课程学习心得功能向课程提供方咨询。<br><br>如需更详细的解答，请告诉我具体想了解哪方面的内容。`;
  }

  // ==================== Courseware Learning ====================

  enterCourseware(courseId, coursewareId) {
    this.goTo('courseware-learn', courseId, coursewareId);
  }

  renderCoursewarePage() {
    const course = MOCK_COURSES.find(c => c.id === this.currentCourseId);
    const catalog = MOCK_COURSE_CATALOG[this.currentCourseId];
    if (!course || !catalog) return;

    let currentCw = null;
    let currentCh = null;
    for (const ch of catalog.chapters) {
      for (const cw of (ch.children || [])) {
        if (cw.id === this.currentCoursewareId) {
          currentCw = cw;
          currentCh = ch;
          break;
        }
      }
      if (currentCw) break;
    }
    if (!currentCw) return;

    const materials = COURSEWARE_MATERIALS[this.currentCoursewareId] || [];

    let contentHtml = '';
    if (currentCw.type === 'video') {
      contentHtml = `
        <div class="courseware-video-player mb-4">
          <video controls poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop">
            <source src="#" type="video/mp4">
            <p>您的浏览器不支持视频播放。</p>
          </video>
        </div>
        ${currentCw.allowDownload ? `<div class="mb-4"><button class="btn btn-primary btn-sm" onclick="app.downloadMaterial('#')">下载视频</button></div>` : ''}
      `;
    } else if (currentCw.type === 'document') {
      if (currentCw.docType === 'ppt') {
        contentHtml = `
          <div class="doc-preview-ppt mb-4">
            <div class="ppt-sidebar">
              <div class="ppt-thumb active">1</div>
              <div class="ppt-thumb">2</div>
              <div class="ppt-thumb">3</div>
            </div>
            <div class="ppt-main">
              <div class="ppt-slide">
                <h2>${currentCw.name}</h2>
                <ul>
                  <li>背景与目标分析</li>
                  <li>核心实施策略</li>
                  <li>典型应用场景</li>
                </ul>
              </div>
              <div class="ppt-controls">
                <span>1 / 3</span>
              </div>
            </div>
          </div>
          ${currentCw.allowDownload ? `<div class="mb-4"><button class="btn btn-primary btn-sm" onclick="app.downloadMaterial('#')">下载PPT</button></div>` : ''}
        `;
      } else {
        contentHtml = `
          <div class="doc-preview-word mb-4">
            <div class="doc-page">
              <div class="doc-header">${currentCw.name}</div>
              <div class="doc-body">
                <h1>${currentCw.name}</h1>
                <p>本文档为 <strong>${currentCh.name}</strong> 配套学习资料，系统梳理了相关核心概念、实施方法与典型案例。</p>
                <h2>一、核心概念</h2>
                <p>在本节中，我们将深入理解基本概念与定义，掌握其在实际教学中的应用价值与操作要点。</p>
                <h2>二、实施方法</h2>
                <ul>
                  <li>方法一是基础操作步骤，适用于常规教学场景；</li>
                  <li>方法二强调互动与学习心得，能够显著提升学生参与度；</li>
                  <li>方法三为进阶策略，适合有一定经验的教师尝试。</li>
                </ul>
                <h2>三、典型案例</h2>
                <p>通过以下案例分析，您可以更直观地理解上述方法在实际课堂中的具体运用与成效。</p>
              </div>
              <div class="doc-footer">1 / 1</div>
            </div>
          </div>
          ${currentCw.allowDownload ? `<div class="mb-4"><button class="btn btn-primary btn-sm" onclick="app.downloadMaterial('#')">下载Word</button></div>` : ''}
        `;
      }
    } else {
      contentHtml = `
        <div class="courseware-text-content mb-4">
          <h3 style="margin-bottom:16px;">${currentCw.name}</h3>
          <p>本节课为 <strong>${currentCh.name}</strong> 的重要组成部分，主要讲解核心概念与基础知识。</p>
          <p style="margin-top:12px;">通过学习本节内容，您将掌握以下要点：</p>
          <ul style="margin-top:8px;padding-left:20px;list-style:disc;">
            <li>理解基本概念与定义</li>
            <li>掌握核心原理与方法</li>
            <li>能够运用所学知识解决实际问题</li>
          </ul>
          <img src="${course.cover}" alt="课程内容配图" style="max-width:100%;border-radius:8px;margin:16px 0;">
          <p>请认真阅读以上内容，并完成课后思考题，以巩固学习效果。</p>
        </div>
      `;
    }

    document.getElementById('courseware-main-content').innerHTML = `
      <div class="flex justify-between items-start mb-4" style="gap:16px;">
        <div>
          <div class="courseware-content-title">${currentCw.name}</div>
          <div class="text-sm text-secondary">${currentCh.name}</div>
        </div>
        ${materials.length > 0 ? `
          <div class="material-tags">
            <div class="material-tag" onclick="app.showMaterialList('${currentCw.id}', ${currentCw.allowDownload ? true : false})">
              <span>&#128206;</span>
              <span>拓展资料（${materials.length}）</span>
            </div>
          </div>
        ` : ''}
      </div>
      ${contentHtml}
    `;

    const learnedIds = new Set();
    const records = TEACHER_LEARNING_RECORDS[this.currentUser.id] || [];
    records.forEach(r => { if (r.completed) learnedIds.add(r.coursewareId); });

    const typeLabels = { video: '视频', text: '图文', document: '文档' };

    document.getElementById('courseware-sidebar-content').innerHTML = catalog.chapters.map(ch => `
      <div class="mb-3">
        <div class="text-sm font-semibold text-primary mb-2">${ch.name}</div>
        <div class="flex flex-col gap-1">
          ${(ch.children || []).map(cw => {
            const isActive = cw.id === this.currentCoursewareId;
            const isLearned = learnedIds.has(cw.id);
            const typeLabel = typeLabels[cw.type] || '图文';
            return `
              <div class="courseware-node ${isActive ? 'active' : ''} ${isLearned ? 'completed' : ''}"
                   onclick="app.switchCourseware('${cw.id}')">
                <span class="cw-tag ${isLearned ? 'status-learned' : 'status-unlearned'}">${isLearned ? '已学' : '未学'}</span>
                <span class="cw-tag type-${cw.type || 'text'}">${typeLabel}</span>
                <span class="cw-name">${cw.name}</span>
                ${isLearned ? '<span class="node-status">&#10003;</span>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');

  }

  switchCourseware(coursewareId) {
    this.currentCoursewareId = coursewareId;
    this.renderCoursewarePage();
  }

  showMaterialList(coursewareId, allowDownload) {
    const materials = COURSEWARE_MATERIALS[coursewareId] || [];
    const container = document.getElementById('material-list-container');
    container.innerHTML = materials.map(m => `
      <div class="flex items-center gap-3" style="padding:12px;background:var(--bg-hover);border-radius:8px;border:1px solid var(--border);">
        <div style="font-size:28px;">&#128196;</div>
        <div style="flex:1;min-width:0;">
          <div class="font-medium text-sm" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.name}</div>
          <div class="text-xs text-tertiary">${m.size || ''}</div>
        </div>
        ${allowDownload ? `<button class="btn btn-primary btn-sm" onclick="app.downloadMaterial('${m.url}'); app.closeModal('modal-material-list');">下载</button>` : ''}
      </div>
    `).join('');
    this.openModal('modal-material-list');
  }

  showMaterialPreview(id, name, size, url, allowDownload) {
    document.getElementById('material-preview-name').textContent = name;
    document.getElementById('material-preview-size').textContent = size || '';

    const ext = name.split('.').pop().toLowerCase();
    const contentEl = document.getElementById('material-preview-content');
    const iconEl = document.getElementById('material-preview-icon');
    const typeEl = document.getElementById('material-preview-type');

    const typeMap = {
      pdf: { icon: '&#128196;', label: 'PDF 文档', type: 'pdf' },
      doc: { icon: '&#128221;', label: 'Word 文档', type: 'word' },
      docx: { icon: '&#128221;', label: 'Word 文档', type: 'word' },
      ppt: { icon: '&#128247;', label: 'PPT 演示文稿', type: 'ppt' },
      pptx: { icon: '&#128247;', label: 'PPT 演示文稿', type: 'ppt' },
      xls: { icon: '&#128202;', label: 'Excel 表格', type: 'excel' },
      xlsx: { icon: '&#128202;', label: 'Excel 表格', type: 'excel' },
      jpg: { icon: '&#127748;', label: '图片', type: 'image' },
      jpeg: { icon: '&#127748;', label: '图片', type: 'image' },
      png: { icon: '&#127748;', label: '图片', type: 'image' },
      gif: { icon: '&#127748;', label: '图片', type: 'image' },
      mp4: { icon: '&#127909;', label: '视频', type: 'video' },
      mov: { icon: '&#127909;', label: '视频', type: 'video' }
    };
    const info = typeMap[ext] || { icon: '&#128196;', label: '文件', type: 'other' };

    iconEl.innerHTML = info.icon;
    typeEl.textContent = info.label;

    if (info.type === 'word') {
      contentEl.innerHTML = `
        <div style="background:#E7E5E4; padding:20px; height:100%; min-height:320px; overflow:auto;">
          <div style="background:#FAFAF9; max-width:560px; margin:0 auto; min-height:480px; padding:40px 48px; box-shadow:0 2px 8px rgba(0,0,0,0.12); border-radius:2px;">
            <div style="font-size:18px; font-weight:600; color:#C8000C; margin-bottom:16px;">${name}</div>
            <div style="width:80%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:12px;"></div>
            <div style="width:95%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:12px;"></div>
            <div style="width:90%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:12px;"></div>
            <div style="width:60%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:24px;"></div>
            <div style="width:100%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:12px;"></div>
            <div style="width:92%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:12px;"></div>
            <div style="width:85%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:12px;"></div>
            <div style="width:70%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:24px;"></div>
            <div style="width:100%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:12px;"></div>
            <div style="width:88%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:12px;"></div>
            <div style="width:75%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:12px;"></div>
          </div>
        </div>`;
    } else if (info.type === 'ppt') {
      contentEl.innerHTML = `
        <div style="background:#292524; padding:20px; height:100%; min-height:320px; display:flex; align-items:center; justify-content:center;">
          <div style="background:#FAFAF9; width:480px; height:270px; border-radius:4px; box-shadow:0 4px 16px rgba(0,0,0,0.3); padding:32px; display:flex; flex-direction:column;">
            <div style="font-size:20px; font-weight:600; color:#C8000C; margin-bottom:16px;">${name}</div>
            <div style="flex:1;">
              <div style="width:60%; height:12px; background:#F5F5F4; border-radius:4px; margin-bottom:10px;"></div>
              <div style="width:80%; height:12px; background:#F5F5F4; border-radius:4px; margin-bottom:10px;"></div>
              <div style="width:70%; height:12px; background:#F5F5F4; border-radius:4px; margin-bottom:10px;"></div>
              <div style="width:50%; height:12px; background:#F5F5F4; border-radius:4px; margin-bottom:10px;"></div>
            </div>
            <div style="display:flex; gap:8px; margin-top:16px;">
              <div style="width:80px; height:50px; background:#F5F5F4; border-radius:4px;"></div>
              <div style="width:80px; height:50px; background:#F5F5F4; border-radius:4px;"></div>
              <div style="width:80px; height:50px; background:#F5F5F4; border-radius:4px;"></div>
            </div>
          </div>
        </div>`;
    } else if (info.type === 'excel') {
      contentEl.innerHTML = `
        <div style="background:#FAFAF9; padding:20px; height:100%; min-height:320px; overflow:auto;">
          <div style="font-size:16px; font-weight:600; color:#57534E; margin-bottom:12px;">${name}</div>
          <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead><tr style="background:#F5F5F4;">
              <th style="border:1px solid #E7E5E4; padding:8px 12px; text-align:left;">序号</th>
              <th style="border:1px solid #E7E5E4; padding:8px 12px; text-align:left;">项目</th>
              <th style="border:1px solid #E7E5E4; padding:8px 12px; text-align:left;">数值</th>
              <th style="border:1px solid #E7E5E4; padding:8px 12px; text-align:left;">备注</th>
            </tr></thead>
            <tbody>
              <tr><td style="border:1px solid #E7E5E4; padding:8px 12px;">1</td><td style="border:1px solid #E7E5E4; padding:8px 12px;">示例数据 A</td><td style="border:1px solid #E7E5E4; padding:8px 12px;">100</td><td style="border:1px solid #E7E5E4; padding:8px 12px;">-</td></tr>
              <tr style="background:#fafafa;"><td style="border:1px solid #E7E5E4; padding:8px 12px;">2</td><td style="border:1px solid #E7E5E4; padding:8px 12px;">示例数据 B</td><td style="border:1px solid #E7E5E4; padding:8px 12px;">200</td><td style="border:1px solid #E7E5E4; padding:8px 12px;">-</td></tr>
              <tr><td style="border:1px solid #E7E5E4; padding:8px 12px;">3</td><td style="border:1px solid #E7E5E4; padding:8px 12px;">示例数据 C</td><td style="border:1px solid #E7E5E4; padding:8px 12px;">300</td><td style="border:1px solid #E7E5E4; padding:8px 12px;">-</td></tr>
              <tr style="background:#fafafa;"><td style="border:1px solid #E7E5E4; padding:8px 12px;">4</td><td style="border:1px solid #E7E5E4; padding:8px 12px;">示例数据 D</td><td style="border:1px solid #E7E5E4; padding:8px 12px;">400</td><td style="border:1px solid #E7E5E4; padding:8px 12px;">-</td></tr>
            </tbody>
          </table>
        </div>`;
    } else if (info.type === 'pdf') {
      contentEl.innerHTML = `
        <div style="background:#292524; padding:20px; height:100%; min-height:320px; overflow:auto;">
          <div style="background:#FAFAF9; max-width:520px; margin:0 auto; min-height:400px; padding:40px 48px; box-shadow:0 2px 8px rgba(0,0,0,0.3);">
            <div style="font-size:18px; font-weight:600; color:#292524; margin-bottom:16px;">${name}</div>
            <div style="width:80%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:12px;"></div>
            <div style="width:95%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:12px;"></div>
            <div style="width:90%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:12px;"></div>
            <div style="width:60%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:24px;"></div>
            <div style="width:100%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:12px;"></div>
            <div style="width:92%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:12px;"></div>
            <div style="width:85%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:12px;"></div>
            <div style="width:70%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:24px;"></div>
            <div style="width:100%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:12px;"></div>
            <div style="width:88%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:12px;"></div>
            <div style="width:75%; height:14px; background:#F5F5F4; border-radius:4px; margin-bottom:12px;"></div>
          </div>
        </div>`;
    } else if (info.type === 'image') {
      contentEl.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:100%; min-height:320px; background:#1a1a1a;"><div style="color:#FAFAF9; font-size:48px;">&#127748;</div></div>`;
    } else if (info.type === 'video') {
      contentEl.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:100%; min-height:320px; background:#1a1a1a;"><div style="color:#FAFAF9; font-size:48px;">&#127909;</div></div>`;
    } else {
      contentEl.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:100%; min-height:320px; flex-direction:column; gap:12px;"><div style="font-size:48px;">&#128196;</div><div style="color:#A8A29E;">该文件类型暂不支持预览</div></div>`;
    }

    const downloadBtn = document.getElementById('material-preview-download-btn');
    if (allowDownload) {
      downloadBtn.style.display = '';
      downloadBtn.onclick = () => {
        this.downloadMaterial(url);
        this.closeModal('modal-material-preview');
      };
    } else {
      downloadBtn.style.display = 'none';
    }
    this.openModal('modal-material-preview');
  }

  downloadMaterial(url) {
    this.toast('开始下载...', 'info');
  }

  // ==================== AI V2.0 Features ====================

  // --- AI Recommendations (Scene A) ---
  // --- AI Learning Insight (Scene D) ---
  renderAiInsight() {
    const card = document.getElementById('ai-insight-card');
    if (!card) return;

    const teacher = this.currentUser;
    const myRelations = TEACHER_COURSE_RELATIONS[teacher.id] || [];
    const completedCount = myRelations.filter(r => r.progress === 100).length;

    // Show card if there's learning data
    if (completedCount > 0) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
      return;
    }

    // ===== 1. 综合评分 =====
    // 能力维度体系（12个维度），教师个人得分
    const allDimensions = [
      { name: '课堂互动', score: 85 },
      { name: '新课标解读', score: 62 },
      { name: '信息化教学', score: 70 },
      { name: '班级管理', score: 45 },
      { name: '作业设计', score: 55 },
      { name: '教学研究', score: 60 },
      { name: '师德修养', score: 78 },
      { name: '课程设计', score: 50 },
      { name: '评价反馈', score: 65 },
      { name: '学生发展', score: 72 },
      { name: '家校沟通', score: 40 },
      { name: '教研引领', score: 58 },
    ];
    // 取前6个维度展示
    const dimensions = allDimensions.sort((a, b) => b.score - a.score).slice(0, 6);
    const totalScore = Math.round(allDimensions.reduce((s, d) => s + d.score, 0) / allDimensions.length);

    document.getElementById('ai-overall-score').textContent = totalScore;
    const hasGroup = teacher.grade && teacher.subject;

    // 计算课程完成率和评价数（阶段性追踪指标需要）
    const studiedCount = myRelations.filter(r => r.progress > 0).length;
    const completionRate = studiedCount > 0 ? Math.round((completedCount / studiedCount) * 100) : 0;
    let reviewCount = 0;
    Object.values(COURSE_REVIEWS).forEach(reviews => {
      reviewCount += reviews.filter(r => r.teacherId === teacher.id).length;
    });

    document.getElementById('ai-score-label').innerHTML = '<span>综合评分</span><span>' + (hasGroup ? '超过同组 ' + Math.round(totalScore * 0.85) + '% 教师' : '') + '</span>';

    const levelEl = document.getElementById('ai-overall-level');
    levelEl.className = 'ai-overall-level';
    if (totalScore >= 80) {
      levelEl.textContent = '优秀';
      levelEl.classList.add('excellent');
    } else if (totalScore >= 60) {
      levelEl.textContent = '良好';
      levelEl.classList.add('good');
    } else {
      levelEl.textContent = '待提升';
      levelEl.classList.add('warning');
    }

    // ===== 2. 能力雷达图 =====
    this.renderInsightRadar(dimensions, hasGroup);

    // ===== 3. AI点评 =====
    const strengths = allDimensions.filter(d => d.score >= 80).sort((a, b) => b.score - a.score);
    const weaknesses = allDimensions.filter(d => d.score < 60).sort((a, b) => a.score - b.score);

    // 总体评价
    document.getElementById('ai-dimension-comment').innerHTML = this.getAiOverallComment(totalScore);

    // 优势领域逐项点评
    document.getElementById('ai-strengths-list').innerHTML = strengths.map(s => {
      const strengthComment = this.getDimensionStrengthComment(s.name, s.score);
      return `
        <div class="ai-analysis-item">
          <div class="ai-dimension-item-header">
            <strong>${s.name}</strong><span class="ai-dimension-score">${s.score}分</span>
          </div>
          <div class="ai-dimension-comment-text">${strengthComment}</div>
        </div>
      `;
    }).join('') || '<div class="ai-analysis-item">暂无突出优势领域，建议全面均衡发展</div>';

    // 待改进项逐项点评
    document.getElementById('ai-weaknesses-list').innerHTML = weaknesses.map(w => {
      const weaknessComment = this.getDimensionWeaknessComment(w.name, w.score);
      return `
        <div class="ai-analysis-item">
          <div class="ai-dimension-item-header">
            <strong>${w.name}</strong><span class="ai-dimension-score">${w.score}分</span>
          </div>
          <div class="ai-dimension-comment-text">${weaknessComment}</div>
        </div>
      `;
    }).join('') || '<div class="ai-analysis-item">各维度发展较为均衡，继续保持</div>';

    // ===== 4. 分层改进建议 =====
    const weakestDim = weaknesses.length > 0 ? weaknesses[0] : allDimensions.sort((a, b) => a.score - b.score)[0];
    const strongestDim = dimensions[0];
    document.getElementById('ai-short-term').innerHTML = `
      <ul>
        <li>完成「${weakestDim.name}」关联课程中未学习的基础课程1门（建议学时：2小时）</li>
        <li>参与1次「${weakestDim.name}」主题的教研讨论</li>
        <li>每日保持30分钟学习时长，连续打卡5天</li>
      </ul>
    `;
    document.getElementById('ai-mid-term').innerHTML = `
      <ul>
        <li>系统学习「${weakestDim.name}」进阶课程，完成率达80%</li>
        <li>尝试将「${strongestDim.name}」经验迁移应用到「${weakestDim.name}」</li>
        <li>完成1份教学实践反思报告</li>
        <li>争取「${weakestDim.name}」维度评分提升至60分以上</li>
      </ul>
    `;

    // ===== 5. 定制化课程推荐（含AI建议） =====
    const recCourses = [
      { name: '班级管理策略与技巧', reason: `针对「${weakestDim.name}」薄弱环节强化`, cover: 'https://picsum.photos/seed/rec1/400/225', advice: `重点研读课程中关于${weakestDim.name}的教学设计框架，尝试将1个单元的教学目标与${weakestDim.name}对应表梳理出来。` },
      { name: '新课标核心素养解读', reason: `补足「${weaknesses.length > 1 ? weaknesses[1].name : weakestDim.name}」理解短板`, cover: 'https://picsum.photos/seed/rec2/400/225', advice: '建议从课程模块2的案例分析入手，结合自身教学实际进行反思与应用。' },
      { name: '高效作业设计方法', reason: `拓展「${strongestDim.name}」优势领域`, cover: 'https://picsum.photos/seed/rec3/400/225', advice: `在已有${strongestDim.name}优势基础上，学习进阶策略，进一步提升专业深度。` },
    ];
    document.getElementById('ai-course-recommendations').innerHTML = `
      <div class="ai-recommend-cards">
        ${recCourses.map(c => `
          <div class="ai-recommend-card" onclick="app.goTo('course-detail', '5')">
            <img src="${c.cover}" alt="${c.name}">
            <div class="ai-recommend-card-body">
              <div class="ai-recommend-card-name">${c.name}</div>
              <div class="ai-recommend-card-reason">&#129302; ${c.reason}</div>
              <div class="ai-recommend-card-advice">&#128161; AI建议：${c.advice}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // ===== 6. 阶段性追踪指标 =====
    // 5步筛选法
    const hasWeakness = weaknesses.length > 0;
    const weaknessName = hasWeakness ? weaknesses[0].name : '';

    // 第1步：必选指标
    const selected = [];
    if (hasWeakness) {
      selected.push({ name: '薄弱维度评分变化', value: `「${weaknessName}」评分变化`, type: 'weakness' });
    }
    selected.push({ name: '推荐课程完成率', value: '推荐课程完成率 0/3', type: 'required' });

    // 第2步：薄弱维度关联指标（至多2个）
    if (hasWeakness) {
      selected.push({ name: '周学习时长稳定性', value: '周学习时长稳定性 稳定', type: 'weakness-related' });
      if (weaknesses.length >= 2) {
        selected.push({ name: '学习连续天数', value: `学习连续天数 ${myRelations.filter(r => r.progress > 0).length > 0 ? Math.min(myRelations.filter(r => r.progress > 0).length, 7) : 0}天`, type: 'weakness-related' });
      } else {
        selected.push({ name: '教学实践反思质量', value: '教学实践反思质量 --', type: 'weakness-related' });
      }
    }

    // 第3步：全局趋势指标（补足至5个）
    const globalPool = [
      { name: '同组排名变化', value: hasGroup ? '同组排名变化 →' : '同组排名变化 --', type: 'global' },
      { name: '学习连续天数', value: `学习连续天数 ${myRelations.filter(r => r.progress > 0).length > 0 ? Math.min(myRelations.filter(r => r.progress > 0).length, 7) : 0}天`, type: 'global' },
      { name: '课程完成率', value: `课程完成率 ${completionRate}%`, type: 'global' },
      { name: '评价参与度', value: `评价参与度 ${reviewCount}条`, type: 'global' },
    ];
    for (const g of globalPool) {
      if (selected.length >= 5) break;
      if (!selected.find(s => s.name === g.name)) {
        selected.push(g);
      }
    }

    // 第4步：无待改进项时的特殊处理（重新选取）
    if (!hasWeakness) {
      // 已选中的重新按全局优先级排列
    }

    // 第5步：截取前5个
    const trackMetrics = selected.slice(0, 5);
    document.getElementById('ai-track-tags').innerHTML = trackMetrics.map(m => `<span class="ai-track-tag">${m.value}</span>`).join('');
    this.refreshIcons();
  }

  renderInsightRadar(dimensions, hasGroup) {
    const radarChart = echarts.init(document.getElementById('ai-insight-radar-chart'));

    // Generate peer average (mock: slightly lower than personal)
    const peerAvg = dimensions.map(d => Math.max(0, Math.min(100, d.score - Math.round(Math.random() * 10 + 5))));

    const seriesData = [
      {
        value: dimensions.map(d => d.score),
        name: '我的水平',
        areaStyle: { color: 'rgba(200, 0, 12, 0.2)' },
        lineStyle: { color: '#C8000C', width: 2 },
        itemStyle: { color: '#C8000C' },
      }
    ];
    const legendData = ['我的水平'];
    if (hasGroup) {
      seriesData.push({
        value: peerAvg,
        name: '同组平均',
        lineStyle: { color: '#78716C', width: 2, type: 'dashed' },
        itemStyle: { color: '#78716C' },
        symbol: 'emptyCircle',
        symbolSize: 6,
      });
      legendData.push('同组平均');
    }

    radarChart.setOption({
      tooltip: { trigger: 'item' },
      legend: {
        data: legendData,
        bottom: 0,
        textStyle: { fontSize: 11, color: '#57534E' }
      },
      radar: {
        indicator: dimensions.map(d => ({ name: d.name, max: 100 })),
        radius: '60%',
        axisName: { fontSize: 11, color: '#57534E' },
        splitArea: { areaStyle: { color: ['#FAFAF9', '#f9f9f9', '#FAFAF9', '#f9f9f9', '#FAFAF9'] } },
      },
      series: [{
        type: 'radar',
        data: seriesData,
      }],
    });

    // Render legend with levels (优秀≥80/良好≥60/待提升<60)
    const legendEl = document.getElementById('ai-radar-legend');
    legendEl.innerHTML = dimensions.map(d => {
      let level, levelClass;
      if (d.score >= 80) { level = '优秀'; levelClass = 'excellent'; }
      else if (d.score >= 60) { level = '良好'; levelClass = 'good'; }
      else { level = '待提升'; levelClass = 'warning'; }
      return `
        <div class="ai-radar-legend-item">
          <div class="ai-radar-legend-color" style="background: ${d.score >= 80 ? '#16A34A' : d.score >= 60 ? '#D97706' : '#C8000C'}"></div>
          <div class="ai-radar-legend-text">${d.name}</div>
          <div class="ai-radar-legend-score">${d.score}分</div>
          <div class="ai-radar-legend-level ai-overall-level ${levelClass}">${level}</div>
        </div>
      `;
    }).join('');
  }

  refreshAiInsight() {
    this.renderAiInsight();
    this.toast('AI学习诊断已刷新', 'success');
  }

  exportAiInsight() {
    const card = document.getElementById('ai-insight-card');
    if (!card) {
      this.toast('报告内容未加载', 'warning');
      return;
    }

    // Show loading overlay
    const loading = document.createElement('div');
    loading.className = 'ai-export-loading';
    loading.innerHTML = `
      <div class="ai-loading-dots"><span></span><span></span><span></span></div>
      <div class="ai-export-loading-text">正在生成报告，请稍候...</div>
    `;
    document.body.appendChild(loading);

    // Use html2canvas to capture the report
    if (typeof html2canvas !== 'undefined') {
      html2canvas(card, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FAFAF9fff',
        logging: false,
      }).then((canvas) => {
        document.body.removeChild(loading);
        const link = document.createElement('a');
        link.download = `AI学习诊断报告_${this.currentUser.name}_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        this.toast('报告导出成功', 'success');
      }).catch((err) => {
        document.body.removeChild(loading);
        console.error('Export failed:', err);
        this.toast('导出失败，请重试', 'error');
      });
    } else {
      document.body.removeChild(loading);
      this.toast('导出功能暂不可用', 'warning');
    }
  }

  renderProfileStats() {
    const teacher = this.currentUser;
    const myRelations = TEACHER_COURSE_RELATIONS[teacher.id] || [];
    const myActivityRels = TEACHER_ACTIVITY_RELATIONS[teacher.id] || [];
    const myRecords = TEACHER_LEARNING_RECORDS[teacher.id] || [];

    const completedCount = myRelations.filter(r => r.progress === 100).length;
    const totalHours = myRelations.reduce((sum, r) => sum + r.earnedHours, 0);
    const activityCount = myActivityRels.length;
    // 课程完成率 = 已学课程数 / 学习过的课程数（progress>0）
    const studiedCount = myRelations.filter(r => r.progress > 0).length;
    const completionRate = studiedCount > 0 ? Math.round((completedCount / studiedCount) * 100) : 0;
    const totalMinutes = myRecords.reduce((sum, r) => sum + (r.duration || 0), 0);

    // Count reviews
    let reviewCount = 0;
    Object.values(COURSE_REVIEWS).forEach(reviews => {
      reviewCount += reviews.filter(r => r.teacherId === teacher.id).length;
    });

    // Streak calculation: count consecutive days from latest learnTime
    let streakDays = 0;
    if (myRecords.length > 0) {
      const sortedDates = [...new Set(myRecords.map(r => r.learnTime.split(' ')[0]))].sort((a, b) => b.localeCompare(a));
      const today = new Date().toISOString().slice(0, 10);
      let checkDate = today;
      // If today has no records, check from yesterday
      if (sortedDates[0] !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (sortedDates[0] !== yesterday) {
          streakDays = 0;
        } else {
          checkDate = yesterday;
        }
      }
      if (streakDays === 0 && sortedDates[0] === today) {
        checkDate = today;
      }
      for (const d of sortedDates) {
        if (d === checkDate) {
          streakDays++;
          const prev = new Date(checkDate);
          prev.setDate(prev.getDate() - 1);
          checkDate = prev.toISOString().slice(0, 10);
        } else if (d < checkDate) {
          break;
        }
      }
    }

    // 同组排名：基于同年级同学科教师能力维度综合评分计算
    const hasGroupRank = teacher.grade && teacher.subject;
    const rankDisplay = hasGroupRank ? (completedCount > 0 ? 'Top 28%' : '--') : '-';

    // Update Core Metrics
    const els = {
      'profile-total-courses': completedCount,
      'profile-total-hours': totalHours.toFixed(1),
      'profile-activity-count': activityCount,
      'profile-rank': rankDisplay,
      'profile-streak-days': streakDays,
      'profile-total-minutes': totalMinutes,
      'profile-completion-rate': completionRate + '%',
      'profile-review-count': reviewCount
    };
    Object.entries(els).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });

    // Render charts and additional sections
    this.renderProfileCharts();
    this.refreshIcons();
  }

  renderProfileCharts() {
    // Active time distribution chart with time ranges
    const timeChart = echarts.init(document.getElementById('profile-active-time-chart'));
    const timeRanges = ['早晨\n06:00-08:00', '上午\n08:00-12:00', '中午\n12:00-14:00', '下午\n14:00-18:00', '晚上\n18:00-22:00'];
    const timeData = [15, 45, 20, 60, 80];
    const maxTimeIdx = timeData.indexOf(Math.max(...timeData));
    const peakTimeMap = ['06:00-08:00', '08:00-12:00', '12:00-14:00', '14:00-18:00', '18:00-22:00'];
    const peakTimeLabel = ['早晨', '上午', '中午', '下午', '晚上'];
    timeChart.setOption({
      grid: { top: 10, right: 10, bottom: 36, left: 36 },
      xAxis: { type: 'category', data: timeRanges, axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', axisLabel: { fontSize: 10 }, name: '分钟' },
      series: [{
        type: 'bar',
        data: timeData,
        itemStyle: { color: '#C8000C', borderRadius: [4, 4, 0, 0] },
        barWidth: '50%'
      }]
    });

    const peakTimeEl = document.getElementById('profile-peak-time');
    if (peakTimeEl) peakTimeEl.textContent = `学习高峰时段：${peakTimeLabel[maxTimeIdx]} ${peakTimeMap[maxTimeIdx]}`;

    // Weekly learning heatmap (simplified as bar chart)
    const weeklyChart = echarts.init(document.getElementById('profile-weekly-heatmap'));
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const dayData = [30, 0, 45, 60, 0, 90, 20];
    weeklyChart.setOption({
      grid: { top: 10, right: 10, bottom: 24, left: 36 },
      xAxis: { type: 'category', data: days, axisLabel: { fontSize: 10 } },
      yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
      series: [{
        type: 'bar',
        data: dayData.map((v, i) => ({
          value: v,
          itemStyle: { color: v > 0 ? '#C8000C' : '#E5E7EB', borderRadius: [4, 4, 0, 0] }
        })),
        barWidth: '50%'
      }]
    });

    const weeklySummaryEl = document.getElementById('profile-weekly-summary');
    const activeDays = dayData.filter(v => v > 0).length;
    const weeklyMinutes = dayData.reduce((a, b) => a + b, 0);
    if (weeklySummaryEl) weeklySummaryEl.textContent = `本周学习 ${activeDays} 天，共 ${weeklyMinutes} 分钟`;
    this.refreshIcons();
  }

  renderAbilityProgress() {
    const container = document.getElementById('profile-ability-progress');
    if (!container) return;

    const abilities = [
      { name: '课堂互动', score: 85, total: 100, color: '#C8000C' },
      { name: '新课标解读', score: 45, total: 100, color: '#C8000C' },
      { name: '信息化教学', score: 60, total: 100, color: '#78716C' },
      { name: '班级管理', score: 30, total: 100, color: '#A8A29E' },
      { name: '作业设计', score: 20, total: 100, color: '#C8000C' }
    ];

    container.innerHTML = abilities.map(ab => {
      const pct = Math.round((ab.score / ab.total) * 100);
      return `
        <div style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 13px; font-weight: 500; color: var(--text-primary);">${ab.name}</span>
            <span style="font-size: 12px; color: var(--text-secondary);">${ab.score}/${ab.total} (${pct}%)</span>
          </div>
          <div style="width: 100%; height: 8px; background: #F3F4F6; border-radius: 4px; overflow: hidden;">
            <div style="width: ${pct}%; height: 100%; background: ${ab.color}; border-radius: 4px; transition: width 0.6s ease;"></div>
          </div>
        </div>
      `;
    }).join('');
    this.refreshIcons();
  }

  renderRecentTimeline() {
    const container = document.getElementById('profile-recent-timeline');
    if (!container) return;

    const records = TEACHER_LEARNING_RECORDS[this.currentUser.id] || [];
    if (records.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 24px; color: var(--text-tertiary); font-size: 13px;">暂无学习记录</div>';
      return;
    }

    // Sort by time descending, take latest 5
    const recentRecords = [...records].reverse().slice(0, 5);

    container.innerHTML = recentRecords.map((rec, idx) => {
      const course = MOCK_COURSES.find(c => c.id === rec.courseId);
      const courseName = course ? course.name : rec.courseId;
      const isLast = idx === recentRecords.length - 1;
      return `
        <div style="display: flex; gap: 12px; ${isLast ? '' : 'margin-bottom: 16px;'} position: relative;">
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: var(--primary); border: 2px solid #FAFAF9; box-shadow: 0 0 0 2px var(--primary-lighter); z-index: 1;"></div>
            ${isLast ? '' : '<div style="width: 2px; flex: 1; background: var(--border-color); margin-top: 4px;"></div>'}
          </div>
          <div style="flex: 1; padding-bottom: 4px;">
            <div style="font-size: 13px; font-weight: 500; color: var(--text-primary); margin-bottom: 2px;">${rec.coursewareName}</div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 2px;">${courseName} · ${rec.chapterName}</div>
            <div style="display: flex; gap: 12px; font-size: 11px; color: var(--text-tertiary);">
              <span>${rec.learnTime}</span>
              <span>学习时长 ${rec.duration} 分钟</span>
              ${rec.completed ? '<span style="color: var(--success);">已完成</span>' : '<span style="color: var(--warning);">学习中</span>'}
            </div>
          </div>
        </div>
      `;
    }).join('');
    this.refreshIcons();
  }

  // --- AI Learning Path (Scene F) ---
  renderAiLearningPath() {
    const container = document.getElementById('ai-path-visual');
    if (!container) return;
    // Default empty state
    container.innerHTML = `
      <div style="text-align:center; padding:40px; color:var(--text-tertiary);">
        <div style="font-size:48px; margin-bottom:12px;">&#128739;</div>
        <div style="font-size:14px;">输入学习目标，AI将为您规划最优学习路径</div>
      </div>
    `;
  }

  setPathGoal(goal) {
    const input = document.getElementById('ai-path-goal-input');
    if (input) input.value = goal;
    // Highlight the tag
    document.querySelectorAll('.ai-path-tag').forEach(tag => {
      tag.classList.toggle('active', tag.textContent.includes(goal));
    });
  }

  generateLearningPath() {
    const input = document.getElementById('ai-path-goal-input');
    const goal = input ? input.value.trim() : '';
    if (!goal) {
      this.toast('请输入学习目标', 'warning');
      return;
    }

    const container = document.getElementById('ai-path-visual');
    container.innerHTML = `
      <div style="text-align:center; padding:40px;">
        <div class="ai-loading-dots" style="justify-content:center;"><span></span><span></span><span></span></div>
        <div style="margin-top:12px; color:var(--text-secondary); font-size:13px;">AI正在为您规划学习路径...</div>
      </div>
    `;

    // Mock path generation
    setTimeout(() => {
      this.renderPathResult(goal);
    }, 1500);
  }

  renderPathResult(goal) {
    const container = document.getElementById('ai-path-visual');
    const allCourses = MOCK_COURSES;
    const candidates = allCourses.slice(0, 5);

    container.innerHTML = `
      <div class="ai-path-start-label">&#128205; 起点：当前水平评估 — 您已具备基础教学能力</div>
      <div class="ai-path-visual">
        <div class="ai-path-phase">
          <div class="ai-path-phase-dot"></div>
          <div class="ai-path-phase-header">
            <span class="ai-path-phase-name">第1阶段（基础必修）</span>
            <span class="ai-path-phase-duration">预计2周</span>
          </div>
          <div class="ai-path-phase-courses">
            ${candidates.slice(0, 3).map(c => `
              <div class="ai-path-course-card" onclick="app.goTo('course-detail', '${c.id}')">
                <img src="${c.cover}" alt="${c.name}">
                <div class="ai-path-course-card-body">
                  <div class="ai-path-course-card-name">${c.name}</div>
                  <span class="ai-path-course-card-tag required">必修</span>
                  <div class="ai-path-course-card-reason">为达成"${goal}"的基础必修课</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="ai-path-phase">
          <div class="ai-path-phase-dot"></div>
          <div class="ai-path-phase-header">
            <span class="ai-path-phase-name">第2阶段（进阶选修）</span>
            <span class="ai-path-phase-duration">预计1周</span>
          </div>
          <div class="ai-path-phase-courses">
            ${candidates.slice(3, 5).map(c => `
              <div class="ai-path-course-card" onclick="app.goTo('course-detail', '${c.id}')">
                <img src="${c.cover}" alt="${c.name}">
                <div class="ai-path-course-card-body">
                  <div class="ai-path-course-card-name">${c.name}</div>
                  <span class="ai-path-course-card-tag optional">选修</span>
                  <div class="ai-path-course-card-reason">拓展${goal}的应用场景</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="ai-path-end-label">&#127942; 目标达成：掌握${goal}核心能力</div>
      <div class="ai-path-actions">
        <button class="btn btn-secondary btn-sm" onclick="app.saveLearningPath()">&#128190; 保存到学习计划</button>
        <button class="btn btn-ghost btn-sm" onclick="app.renderAiLearningPath()">&#128260; 重新规划</button>
      </div>
    `;
  }

  saveLearningPath() {
    this.toast('学习路径已保存到您的学习计划', 'success');
  }

  // --- AI Context-Aware Quick Commands ---
  getPageContextCommands() {
    const page = this.currentPage;
    const commands = {
      'teacher-space': ['推荐适合我的课程', '解释课程类型', '搜索教学方法'],
      'course-detail': ['总结本课程核心知识点', '本课程重点难点', '梳理章节结构'],
      'courseware-learn': ['总结本节重点', '如何应用到课堂', '和之前章节的关系'],
      'activity-detail': ['活动需要准备什么', '学时怎么算', '活动评价标准'],
      'teacher-space-learning': ['我的学习进度如何', '接下来该学什么', '同组学习对比']
    };
    return commands[page] || [];
  }

  renderAiContextCommands() {
    const sidebar = document.getElementById('ai-agent-sidebar');
    if (!sidebar) return;
    let cmdContainer = document.getElementById('ai-context-commands');
    if (!cmdContainer) {
      cmdContainer = document.createElement('div');
      cmdContainer.id = 'ai-context-commands';
      cmdContainer.className = 'ai-context-commands';
      const body = document.getElementById('ai-agent-sidebar-body');
      if (body) body.insertBefore(cmdContainer, body.firstChild);
    }

    const commands = this.getPageContextCommands();
    if (commands.length === 0) {
      cmdContainer.style.display = 'none';
      return;
    }
    cmdContainer.style.display = 'flex';
    cmdContainer.innerHTML = commands.map(cmd =>
      `<span class="ai-context-command" onclick="app.quickAsk('${cmd}')">${cmd}</span>`
    ).join('');
  }
}


// Character count listener
document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('review-content-input');
  if (textarea) {
    textarea.addEventListener('input', () => {
      if (app) app.updateReviewCharCount();
    });
  }
});

const app = new TeacherApp();
