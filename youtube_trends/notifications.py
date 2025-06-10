"""
Notification Manager for sending trend alerts via multiple channels
"""

import os
import json
from typing import Dict, List
from datetime import datetime
import httpx
from jinja2 import Template
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from slack_sdk.webhook import WebhookClient
from dotenv import load_dotenv

load_dotenv()


class NotificationManager:
    """Handles sending notifications through various channels"""
    
    def __init__(self):
        self.email_enabled = bool(os.getenv('SENDGRID_API_KEY'))
        self.slack_enabled = bool(os.getenv('SLACK_WEBHOOK_URL'))
        
    async def send_all(self, data: Dict):
        """Send notifications through all enabled channels"""
        tasks = []
        
        if self.email_enabled:
            tasks.append(self.send_email(data))
            
        if self.slack_enabled:
            tasks.append(self.send_slack(data))
            
        # Add more channels here as needed
        
        for task in tasks:
            try:
                await task
            except Exception as e:
                print(f"Notification error: {e}")
    
    async def send_email(self, data: Dict):
        """Send email notification using SendGrid"""
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; }
                h1 { color: #ff0000; }
                .video-card { 
                    border: 1px solid #ddd; 
                    padding: 15px; 
                    margin: 10px 0; 
                    border-radius: 8px;
                    display: flex;
                    gap: 15px;
                }
                .video-info { flex: 1; }
                .video-title { font-weight: bold; color: #333; margin-bottom: 5px; }
                .video-stats { color: #666; font-size: 14px; }
                .trending-badge { 
                    background: #ff0000; 
                    color: white; 
                    padding: 2px 8px; 
                    border-radius: 4px;
                    font-size: 12px;
                }
                .thumbnail { width: 120px; height: 90px; object-fit: cover; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🔥 YouTube Trending Videos Alert</h1>
                <p>Found {{ video_count }} trending videos!</p>
                
                {% for video in videos %}
                <div class="video-card">
                    {% if video.thumbnail %}
                    <img src="{{ video.thumbnail }}" alt="{{ video.title }}" class="thumbnail">
                    {% endif %}
                    <div class="video-info">
                        <div class="video-title">
                            <a href="{{ video.url }}" style="text-decoration: none; color: #333;">
                                {{ video.title }}
                            </a>
                            <span class="trending-badge">{{ video.multiple }} average</span>
                        </div>
                        <div class="video-stats">
                            Channel: {{ video.channel }} | Views: {{ video.views }}
                        </div>
                    </div>
                </div>
                {% endfor %}
                
                <hr>
                <p style="color: #666; font-size: 12px;">
                    Generated at {{ timestamp }}
                </p>
            </div>
        </body>
        </html>
        """
        
        template = Template(html_template)
        html_content = template.render(**data)
        
        message = Mail(
            from_email=os.getenv('FROM_EMAIL'),
            to_emails=os.getenv('TO_EMAIL'),
            subject=f"🔥 {data['video_count']} Trending YouTube Videos Found!",
            html_content=html_content
        )
        
        try:
            sg = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))
            response = await sg.send(message)
            print(f"Email sent successfully: {response.status_code}")
        except Exception as e:
            print(f"Email error: {e}")
    
    async def send_slack(self, data: Dict):
        """Send Slack notification"""
        webhook = WebhookClient(os.getenv('SLACK_WEBHOOK_URL'))
        
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"🔥 {data['video_count']} Trending YouTube Videos Found!"
                }
            }
        ]
        
        for video in data['videos'][:5]:  # Top 5 for Slack
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*<{video['url']}|{video['title']}>*\n"
                            f"Channel: {video['channel']} | Views: {video['views']} "
                            f"| *{video['multiple']} average*"
                }
            })
        
        response = webhook.send(blocks=blocks)
        print(f"Slack notification sent: {response.status_code}")
    
    async def send_webhook(self, data: Dict, webhook_url: str):
        """Send to custom webhook"""
        async with httpx.AsyncClient() as client:
            response = await client.post(webhook_url, json=data)
            print(f"Webhook sent: {response.status_code}")


# Email template for more sophisticated formatting
EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>YouTube Trend Report</title>
    <style>
        /* Reset styles */
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; }
        
        /* Base styles */
        body {
            margin: 0;
            padding: 0;
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background-color: #f4f4f4;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        
        .header {
            background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%);
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
        }
        
        .content {
            padding: 30px;
        }
        
        .video-item {
            border-bottom: 1px solid #e0e0e0;
            padding: 20px 0;
        }
        
        .video-item:last-child {
            border-bottom: none;
        }
        
        .video-title {
            font-size: 18px;
            font-weight: bold;
            color: #333333;
            text-decoration: none;
            display: block;
            margin-bottom: 8px;
        }
        
        .video-meta {
            color: #666666;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .trending-badge {
            display: inline-block;
            background-color: #ff4444;
            color: #ffffff;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .footer {
            background-color: #f8f8f8;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #999999;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <h1>🔥 YouTube Trend Alert</h1>
        </div>
        
        <!-- Content -->
        <div class="content">
            <p style="font-size: 16px; color: #333;">
                We've identified <strong>{{ video_count }}</strong> trending videos 
                that are outperforming their channel averages!
            </p>
            
            {% for video in videos %}
            <div class="video-item">
                <a href="{{ video.url }}" class="video-title">{{ video.title }}</a>
                <div class="video-meta">
                    <strong>{{ video.channel }}</strong><br>
                    {{ video.views }} views • 
                    <span class="trending-badge">{{ video.multiple }} channel average</span>
                </div>
            </div>
            {% endfor %}
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>Generated on {{ timestamp }}</p>
            <p>YouTube Trend Detector • Powered by Apify</p>
        </div>
    </div>
</body>
</html>
"""