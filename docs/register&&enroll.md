# CA注册流程（register && enroll）

## **Admin用户注册**
fabric-ca注册过程中，如果要对用户进行注册，首先需要一个登记员（registrar）,即Admin用户，所以实现注册用户之前需要先enroll一个Admin用户，步骤如下：  
1. 构建、初始化配置文件config，从配置文件获得CA配置和CSP配置（CSP配置暂时不用折腾），CA配置用于实例化fabric-ca-client的时候使用，其他配内容  
配置文件形式如下：  
```json
{
    "certificateAuthorities": {
		"fabric-ca": {
			"url": "http://localhost:7054",
			"httpOptions": {
				"verify": true
			},
			"registrar": [
				{
					"enrollId": "admin",
					"enrollSecret": "adminpw"
				}
			],
			"caName": null
		}
	}
}
```
2. 创建KeyVlaueStore实例，用于存储用户注册时的信息（例如存储在dir/hfc-key-store目录下），存储信息包括证书、私钥等，将在fabric-ca-client.enroll()方法中生成并返回  
3. 创建fabric-ca-client实例  
4. fabric-ca-client调用enroll方法，传入参数为:  
```json
{
    enrollmentID: "admin",
    enrollmentSecret: "adminpw"
}
```  
admin账户使用设置好的ID和Secret，其他用户user使用上传的用户名和系统生成的密码，方法生成并返回注册证书和私钥（对，注册证书和私钥使用系统CA分发的方式生成）  
5. 保存Admin的上下文环境（证书、私钥等），即将文件保存在dir/hfc-key-store目录下，完成admin注册，保存代码如下：  
```js
fabric_client.setUserContext(member_user)
```

## **普通用户User注册**  
fabric-ca对普通用户进行注册，需要进行register和enroll两步，除了register以外，其余步骤和admin用户注册步骤相同
1. register  
register需要用到admin用户，在enroll之前，函数返回**enrollmentSecret**参数作为enroll函数的输入，示例代码如下：
```js
fabric_ca_client.register({enrollmentID: 'user1', affiliation: 'org1.department1',role: 'client'}, admin_user);
```

## **CA普通用户注册流程图**  
![CA注册流程图](/doc_images/register&&enroll.png)


# Fabric CA（官方翻译）
It’s because CAs are so important that Fabric provides a built-in CA component to allow you to create CAs in the blockchain networks you form. This component — known as Fabric CA is a private root CA provider capable of managing digital identities of Fabric participants that have the form of X.509 certificates. Because Fabric CA is a custom CA targeting the Root CA needs of Fabric, it is inherently not capable of providing SSL certificates for general/automatic use in browsers. However, because some CA must be used to manage identity (even in a test environment), Fabric CA can be used to provide and manage certificates. It is also possible — and fully appropriate — to use a public/commerical root or intermediate CA to provide identification.  
  
这是因为CA非常重要，Fabric提供了一个内置的CA组件，允许您在您构建好的区块链网络中创建CA。这个组件称为Fabric CA，它是一个私有根CA提供者，能够管理具有X.509证书形式的Fabric参与者的数字身份。由于Fabric CA是定制CA，针对Fabric的根CA需求，因此它本身无法提供用于浏览器中的一般/自动使用的SSL证书。但是，由于必须使用某些CA来管理身份（即使在测试环境中），Fabric CA也可用于提供和管理证书。使用公共/商业根或中间CA来提供标识也是可能的 - 也是完全合适的。

# CA证书链思考
Fabric CA是定制CA，我们需要接入新的根CA，将Fabric CA作为中间证书。

# CA Server文件配置——组织结构配置
由于用户注册时需要选定CA Server定义好的组织（OrgName），注册也需要在联系（affiliation）字段中选择组织结构，于是需要配置CA Server的配置文件：fabric-ca-server-config.yaml  
```yaml
affiliations:
	org1:
		- department1
		- department2
	org2:
		- department1
	Org1MSP:
		- department1
```  
并且在上述配置中添加Org1MSP组织结构，使得在使用CA注册的时候可以选择使用Org1MSP进行注册，这里注册的MSPID和配置节点信息时使用的MSPID一致时才能保证用户属于某一节点和某一组织。配置完成之后需要重新init CA Server。
```shell
fabric-ca-server init
fabric-ca-server start
```  
初始化好CA Server之后可以在sqlite的数据库中查affiliations表中的字段，会显示有org1msp组织，并且组织名会用小写字母表示。  
所以，使用register函数时，请求的affiliations参数内容需要全部小写才能成功。示例如下：
```js
//使用CA register User用户
fabric_ca_client.register({
	enrollmentID: options.enroll_id,
	affiliation: options.msp_id.toLowerCase() + '.department1',
	role: options.role
}, admin_user);
```