# pip install discord.py discord-py-interactions qrcode pillow opencv-python requests

import discord
from discord.ext import commands
from discord import app_commands
from discord.ui import Button, View, Modal, TextInput
import qrcode
import io
import requests
from PIL import Image
import cv2
import numpy as np

TOKEN = 'TOken'
GUILD_ID = '0'

class QRModal(Modal):
    def __init__(self):
        super().__init__(title="QR Code Generator", timeout=None)

        self.url_input = TextInput(
            label="ใส่ลิ้งค์ในช่องด้านล่าง",
            placeholder="ลิ้ง | Url",
            custom_id="QrCode_Generator"
        )
        self.add_item(self.url_input)

    async def on_submit(self, interaction: discord.Interaction):
        try:
            url = self.url_input.value
            img = self.generate_qr_code(url)

            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            buffer.seek(0)

            file = discord.File(buffer, filename="qrcode.png")
            await interaction.response.send_message(file=file, ephemeral=True)
        except Exception as e:
            await interaction.response.send_message(f"Error generating QR code: {e}", ephemeral=True)

    def generate_qr_code(self, url):
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(fill='black', back_color='white')
        return img

class ScanQRModal(Modal):
    def __init__(self):
        super().__init__(title="Scan QR Code", timeout=None)

        self.image_url_input = TextInput(
            label="ใส่ลิงค์ในช่องด้านล่าง",
            placeholder="ลิงค์รูปภาพคิวอาร์โค้ด | Url Qr Code Image",
            custom_id="Scan_QrCode"
        )
        self.add_item(self.image_url_input)

    async def on_submit(self, interaction: discord.Interaction):
        try:
            image_url = self.image_url_input.value
            data, image = self.scan_qr_code(image_url)

            if data:
                embed = discord.Embed(
                    title="QR Code Scan Successfully",
                    description=f"[Link to the website]({data})",
                    color=0x00AE86
                )
                embed.set_thumbnail(url=image_url)
                await interaction.response.send_message(embed=embed, ephemeral=True)
            else:
                await interaction.response.send_message(content="Failed to scan QR code.", ephemeral=True)
        except Exception as e:
            await interaction.response.send_message(f"Error scanning QR code: {e}", ephemeral=True)

    def scan_qr_code(self, image_url):
        response = requests.get(image_url)
        img = Image.open(io.BytesIO(response.content))

        img = img.convert('RGB')
        img_array = np.array(img)
        img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

        detector = cv2.QRCodeDetector()
        data, points, _ = detector.detectAndDecode(img_cv)
        return data, img_cv

class MyClient(discord.Client):
    def __init__(self):
        super().__init__(intents=discord.Intents.default())
        self.tree = app_commands.CommandTree(self)

    async def setup_hook(self):
        guild = discord.Object(id=GUILD_ID)
        self.tree.copy_global_to(guild=guild)
        await self.tree.sync(guild=guild)

client = MyClient()
bot = commands.Bot(command_prefix="!", intents=discord.Intents.default(), client=client)

@client.event
async def on_ready():
    print(f'Started')

@client.tree.command(name="qr_menu", description="QR Code Generator")
async def qr_menu(interaction: discord.Interaction):
    embed = discord.Embed(
        title="QR Code Tools",
        description="```กดปุ่มด้านล่างเพื่อทำการสร้างคิวอาร์โค้ด หรือสแกนคิวอาร์โค้ด.```",
        color=0x00AE86
    )

    generate_button = Button(label="Generate QR Code", style=discord.ButtonStyle.primary)
    scan_button = Button(label="Scan QR Code", style=discord.ButtonStyle.secondary)

    async def generate_button_callback(interaction: discord.Interaction):
        modal = QRModal()
        await interaction.response.send_modal(modal)

    async def scan_button_callback(interaction: discord.Interaction):
        modal = ScanQRModal()
        await interaction.response.send_modal(modal)

    generate_button.callback = generate_button_callback
    scan_button.callback = scan_button_callback
    view = View()
    view.add_item(generate_button)
    view.add_item(scan_button)

    await interaction.response.send_message(embed=embed, view=view)

client.run(TOKEN)
