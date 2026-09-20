const fs = require('fs');
const filePath = 'src/components/NotificationBell.jsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Update how notifications are fetched because backend returns { notifications, ... }
content = content.replace('setNotifications(res.data.data);', 'setNotifications(res.data.data.notifications || res.data.data);');

// Add View All link at the bottom of the dropdown
if (!content.includes('View all notifications')) {
  const mapEnd = '</button>\n              </div>\n            ))\n          ) : (\n            <div className="p-4 text-center text-sm text-gray-500">\n              No notifications\n            </div>\n          )}';
  
  const replaceWith = mapEnd + '\n          <div className="p-3 text-center border-t border-gray-100 bg-gray-50 rounded-b-xl">\n            <button onClick={() => { setIsOpen(false); navigate("/dashboard/notifications"); }} className="text-sm font-medium text-blue-600 hover:text-blue-700 w-full text-center">View all notifications</button>\n          </div>';
  
  content = content.replace(mapEnd, replaceWith);
  fs.writeFileSync(filePath, content, 'utf-8');
}
console.log('Updated NotificationBell.jsx');
