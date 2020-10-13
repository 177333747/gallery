var connection = new JsStore.Instance();

var fileToUpload;

var imageExtension = new Array(".jpg", ".jpeg", ".png", ".bmp");

window.onload = function () {
    initJsStore('BlobDemo');
    showAllImages();
    registerEvents();
}

function registerEvents() {
    $("#addImage").click(function () {
        saveImageToDB({
            ImageName: fileToUpload.name,
            ImageContent: new Blob([fileToUpload])
        }).then(function (rowsAffected) {
            rowsAffected > 0 && showAllImages();
            $("#imageToUploadOuter").hide();
            $("#inputImageUpload").val("");
        });
    });

    $("#cancelImage").click(function () {
        $("#imageToUploadOuter").hide();
        $("#imageToUpload").attr("src", "");
        $("#inputImageUpload").val("");
    });

    $("#btnClearImages").click(function () {
       
        clearTable('ImageTable').
        then(function () {
            $("#uploadedImageList .panel-body").html("<div style='text-align:center;font-size:16px;color:#777;'>No Image Found</div>");
            $("#btnClearImages").hide();
        });
    });
    

    $(document).on("click", "#uploadedImageList .image-thumbnail", function () {
        getImageById($(this).attr("data-id"))
            .then(function (image) {
                if (image.length > 0) {
                    getImageUrlFromBlob(image[0].ImageContent).then(function (result) {
                        $("#selectedImagePreview").modal();
                        $("#selectedImagePreview .modal-body").html('<img src="' + result + '"/>')
                        $("#selectedImagePreview .modal-footer").html('<div style="text-align:left"><b>' + 'Название: '+image[0].ImageName +'<p>Размер: ' +String(image[0].ImageContent.size/(1024*1024)).slice(0,5) + ' Мб'+'</b></div>')
                       
                
                    });
                } else {
                    alert("Изображение не найдено в БД");
                }
            })
    })
}

function log(msg) {
    console.log(msg);
}

function getDBStructure(dbName) {
    var tblImage = {
        Name: "ImageTable",
        Columns: [{
                Name: "ImageId",
                PrimaryKey: true,
                AutoIncrement: true
            },
            {
                Name: "ImageName",
                NotNull: true,
                DataType: 'string'
            },
            {
                Name: "ImageContent",
                DataType: 'object',
                EnableSearch: false 
            }
        ]
    };

    return {
        Name: dbName,
        Tables: [tblImage]
    }
}

function initJsStore(dbName) {
    JsStore.isDbExist(dbName).
    then(function (isExist) {
        if (isExist) {
            connection.openDb(dbName);
        } else {
            var db = getDBStructure(dbName);
            connection.createDb(db);
        }
    }).
    catch(function (err) {
        alert(err._message);
        console.log(err);
    });
}

function deleteTable(tableName) {
    return connection.delete({
        From: tableName
    });
}

function clearTable(tableName) {
    return connection.clear(tableName)
}

function saveImageToDB(value) {
    return connection.insert({
        Into: "ImageTable",
        Values: [value]
    });
}

function getImages() {
    return connection.select({
        From: "ImageTable",
        Order: {
            By: 'ImageId',
            Type: 'desc'
        }
    });
}

function getImageById(imageId) {
    return connection.select({
        From: "ImageTable",
        Where: {
            ImageId: Number(imageId)
        }
    });
}




function isImageValid(file) {
    var isValid = false,
        fileName;
    if (file.files.length > 0) {
        fileName = file.files[0].name;
        imageExtension.every(function (item) {
            if (fileName.indexOf(item) >= 0) {
                isValid = true;
                return false;
            }
            return true;
        });
    }
    return isValid;
}

function getImageUrlFromBlob(file) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function (e) {
            resolve(e.target.result);
        };
        reader.onerror = function (error) {
            console.log('Error: ' + error);
            reject(error);
        };
        reader.readAsDataURL(file);
    });

}

function previewOfImageToUpload() {
    $("#imageToUploadOuter").show();
    getImageUrlFromBlob(fileToUpload).
    then(function (result) {
        $('#imageToUpload').attr('src', result);
    });
}

function uploadImage(file) {
    if (isImageValid(file)) {
        fileToUpload = file.files[0];
        previewOfImageToUpload();
    } else {
        log("Поддерживаемые типы:  " + (imageExtension.join("  ")));
        alert("Неподдерживаемый формат")
        file.value = "";
        file.focus();
    }
}

function showAllImages() {
    getImages().
    then(function (images) {
        $("#uploadedImageList .panel-body").html("");
        if (images.length == 0) {
            $("#uploadedImageList .panel-body").html("<div style='text-align:center;font-size:16px;color:#777;'>Изображения не найдены</div>");
            $("#btnClearImages").hide();
        } else {
            images.forEach(function (image) {
                getImageUrlFromBlob(image.ImageContent).then(function (result) {
                    $("#uploadedImageList .panel-body").append('<div class="image-thumbnail col-sm-2" data-id="' + image.ImageId + '"><img src="' + result + '" /></div>');
                });
            });
            $("#btnClearImages").show();
        }
    });
}
