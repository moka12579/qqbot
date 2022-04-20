import pyzbar.pyzbar as pyzbar
from PIL import Image,ImageEnhance
import os

img_dir = "img"
def open_img():
    img_list = []
    for _,_,file_list in os.walk(img_dir):
        img_list = [os.path.join(img_dir,file) for file in file_list if file.endswith(".jpg") or file.endswith(".png") ]
    print("所有文件:{}".format(img_list))

    return img_list



def show():
    img_list = open_img()
    for _img in img_list:
        img = Image.open(_img)
        # img = ImageEnhance.Brightness(img).enhance(2.0)#增加亮度

        # img = ImageEnhance.Sharpness(img).enhance(17.0)#锐利化

        # img = ImageEnhance.Contrast(img).enhance(4.0)#增加对比度

        # img = img.convert('L')#灰度化
        texts = pyzbar.decode(img)
        if not texts:
            print("{}文件不存在二维码".format(_img))
        for text in texts:
            t = text.data.decode("utf-8")
            if t:
                print("{}文件存在二维码，内容为：{}".format(_img,t))



if __name__ == '__main__':
    show()