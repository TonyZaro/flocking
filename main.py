from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from google.appengine.ext.webapp import template
from google.appengine.ext.db import djangoforms
from google.appengine.api import users



class AwesomeFlocking(webapp.RequestHandler):
	
	def get(self):
		html = template.render('templates/main.html',{})

		self.response.out.write(html)
		

		
	
app = webapp.WSGIApplication([('/.*',AwesomeFlocking)],debug=True)

def main():
	run_wsgi_app(app)	#this will start the web app
	
if __name__ == '__main__':
	main()