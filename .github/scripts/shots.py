"""Serve the web build and screenshot every screen with a seeded test state."""
import json, os, sys, threading, time, http.server, socketserver, functools
from playwright.sync_api import sync_playwright

root, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)

class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def send_head(self):
        p = self.translate_path(self.path.split('?')[0])
        if not os.path.exists(p):
            self.path = '/index.html'
        return super().send_head()
srv = socketserver.TCPServer(('127.0.0.1', 8765), functools.partial(H, directory=root))
threading.Thread(target=srv.serve_forever, daemon=True).start()

now = int(time.time() * 1000); DAY = 86400000
def dk(ms):
    t = time.localtime(ms / 1000); return '%04d-%02d-%02d' % (t.tm_year, t.tm_mon, t.tm_mday)
state = {
  'intro': 1, 'user': {'id': 'test', 'name': 'Ruth', 'email': 'ruth@example.com', 'provider': 'email', 'test': True},
  'goals': [{'id': 'g1', 'name': 'Morning prayer', 'theme': 'Prayer', 'period': 'day', 'time': '07:00', 'days': [0,1,2,3,4,5,6], 'on': True},
            {'id': 'g2', 'name': 'Find peace', 'theme': 'Peace', 'period': 'week', 'time': '22:00', 'days': [0,1,2,3,4,5,6], 'on': True}],
  'done': {'g1': {dk(now - i * DAY): 1 for i in range(1, 6)}},
  'saved': [{'id': 'John 14:27|x', 'a': 'I receive the peace of Christ, and I will not let my heart be troubled.', 'ref': 'John 14:27', 'at': now}],
  'hl': {'42.3.16': 0, '18.23.1': 2}, 'marks': ['42.3.17'], 'notes': {'18.23.1': {'t': 'He leads me.', 'to': 0, 'at': now}},
  'pos': {'b': 18, 'c': 23},
  'rec': {'trackers': [{'id': 't1', 'kind': 'porn', 'label': 'Pornography', 'start': now - 9 * DAY, 'created': now - 12 * DAY, 'first': now - 12 * DAY, 'best': 3, 'total': 3, 'slips': [now - 9 * DAY], 'reasons': ['My family'], 'triggers': ['Tired'], 'plans': [{'when': 'Tired', 'then': 'Go to bed instead of staying up'}], 'cost': 5, 'remind': '08:00', 'remind2': '21:00'}],
          'logs': {'t1': {dk(now - DAY): {'clean': True, 'crave': 4, 'moods': ['Hopeful'], 'mood': 'Hopeful', 'answers': [], 'journal': 'A good day.', 'tasks': {}, 'at': now - DAY}}}, 'urges': {}},
  'ur': {'sessions': [{'id': 'u1', 'name': 'Morning warfare', 'themes': ['Warfare'], 'custom': [], 'gen': [], 'verses': ['Ephesians 6:10-12', 'James 4:7'], 'scrOn': True, 'every': 2, 'playlist': [{'t': 'scape', 'id': 'hymn'}], 'target': 20}],
         'watches': [{'id': 'w1', 'name': 'Fourth watch', 'time': '03:00', 'days': [0,1,2,3,4,5,6], 'dur': 60, 'on': True, 'themes': ['Warfare'], 'verses': ['Psalm 91:1-2'], 'scrOn': True, 'every': 2, 'playlist': [{'t': 'scape', 'id': 'deep'}]}],
         'logs': [{'id': 'l1', 'kind': 'session', 'name': 'Morning warfare', 'start': now - DAY, 'secs': 1260, 'silence': 60, 'heard': 'Be still.', 'at': now - DAY}], 'fired': {}, 'repeat': 'all'},
  'packs': {'owned': {}, 'prog': {'money': {'1': 1}}},
  'jn': {'books': [{'id': 'b1', 'name': 'Daily journal', 'icon': 'sun', 'c': 'butter', 'at': now}, {'id': 'b2', 'name': 'Prayers', 'icon': 'heart', 'c': 'rose', 'at': now}],
         'notes': [{'id': 'n1', 'book': 'b1', 'title': 'Grateful', 'body': 'Thank you for this morning.', 'c': 'butter', 'pin': False, 'mood': 'Grateful', 'tags': ['thanks'], 'verse': '', 'items': [], 'created': now, 'updated': now, 'trash': None}]},
}
routes = [('01-today', '/'), ('02-explore', '/explore'), ('03-goals', '/goals'), ('04-saved', '/saved'), ('05-bible', '/bible'),
          ('06-settings', '/settings'), ('07-ur', '/ur'), ('08-ur-edit', '/ur/edit?k=session&id=u1'), ('09-insights', '/insights'),
          ('10-journal', '/journal'), ('11-journal-edit', '/journal/edit?id=n1'), ('12-free', '/free?id=t1'), ('13-free-check', '/free/check?id=t1'),
          ('14-free-sos', '/free/sos?id=t1'), ('15-free-wizard', '/free/wizard'), ('16-guide', '/guide'), ('17-audio', '/audio'),
          ('18-packs', '/packs'), ('19-pack', '/pack?id=money'), ('20-day', '/day?p=money&d=2'), ('21-widgets', '/widgets'), ('22-paywall', '/paywall')]
errs = []
with sync_playwright() as p:
    br = p.chromium.launch()
    def ctx(seed):
        c = br.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, color_scheme='dark')
        c.route('https://images.unsplash.com/**', lambda r: r.abort())
        if seed is not None:
            c.add_init_script('localStorage.setItem("selah.v1", %s)' % json.dumps(json.dumps(seed)))
        return c
    c = ctx(state)
    for name, path in routes:
        pg = c.new_page(); pg.on('pageerror', lambda e, n=name: errs.append(f'{n}: {e}')); pg.on('console', lambda m, n=name: errs.append(f'{n} console.{m.type}: {m.text[:300]}') if m.type == 'error' else None)
        try:
            pg.goto('http://127.0.0.1:8765' + path, wait_until='networkidle', timeout=30000); pg.wait_for_timeout(3600)
            pg.screenshot(path=f'{out}/{name}.png', full_page=False)
            h = pg.evaluate('Math.max(...[...document.querySelectorAll("*")].filter(e=>{const s=getComputedStyle(e);return (s.overflowY=="auto"||s.overflowY=="scroll")&&e.scrollHeight>e.clientHeight}).map(e=>e.scrollHeight),0)')
            if h > 844:
                pg.evaluate('[...document.querySelectorAll("*")].filter(e=>{const s=getComputedStyle(e);return (s.overflowY=="auto"||s.overflowY=="scroll")&&e.scrollHeight>e.clientHeight}).forEach(e=>e.scrollTop=e.scrollHeight/2.2)')
                pg.wait_for_timeout(500); pg.screenshot(path=f'{out}/{name}-b.png')
        except Exception as e:
            errs.append(f'{name}: {e}')
        pg.close()
    c.close()
    for name, seed in [('00-welcome', {}), ('00-light-today', dict(state, settings={'theme': 'light', 'font': 19, 'card': 'auto', 'sound': True, 'read': 'sans', 'lang': 'en', 'ver': 'kjv'})), ('00-fr-today', dict(state, settings={'theme': 'dark', 'font': 19, 'card': 'auto', 'sound': True, 'read': 'sans', 'lang': 'fr', 'ver': 'lsg'}))]:
        c = ctx(seed); pg = c.new_page(); pg.on('pageerror', lambda e, n=name: errs.append(f'{n}: {e}'))
        try:
            pg.goto('http://127.0.0.1:8765/', wait_until='networkidle', timeout=30000); pg.wait_for_timeout(3600); pg.screenshot(path=f'{out}/{name}.png')
            if name == '00-welcome':
                pg.get_by_text('Get started').click(); pg.wait_for_timeout(900); pg.screenshot(path=f'{out}/00-onboarding.png')
        except Exception as e: errs.append(f'{name}: {e}')
        c.close()
    br.close()
open(f'{out}/errors.txt', 'w').write('\n'.join(errs) or 'none')
print('\n'.join(errs) or 'no errors')
