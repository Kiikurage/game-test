// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms

struct objectStruct {
	nodeUniform0 : vec3<f32>,
	nodeUniform1 : vec3<f32>,
	nodeUniform2 : mat4x4<f32>,
	nodeUniform4 : vec3<f32>,
	nodeUniform5 : f32
};
@binding( 0 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform7 : vec3<f32>,
	nodeUniform10 : vec3<f32>,
	nodeUniform6 : vec3<f32>,
	cameraPosition : vec3<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar0 : vec4<f32>;
var<private> nodeVar1 : vec3<f32>;
var<private> Output : vec4<f32>;
var<private> irradiance : vec3<f32>;
var<private> normalFlat : vec3<f32>;
var<private> normalViewGeometry : vec3<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar2 : f32;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : vec3<f32>;
var<private> nodeVar6 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar7 : vec4<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar8 : vec3<f32>;
var<private> nodeVar9 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar10 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar11 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar12 : vec3<f32>;
var<private> nodeVar13 : vec4<f32>;

// codes


@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) nodeVarying5 : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar0 = ( nodeVarying5 * vec4<f32>( vec3<f32>( 0.06, 0.065, 0.085 ), 1.0 ) );
	nodeVar1 = mix( object.nodeUniform0, object.nodeUniform1, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform4 ), 0.0, 1.0 ), 2.5 ) );
	DiffuseColor = mix( mix( mix( nodeVar0, vec4<f32>( nodeVar1, 1.0 ), 0.14 ), vec4<f32>( nodeVar1, 1.0 ), ( smoothstep( 73.71623276130094, 33.71623276130094, v_positionWorld.y ) * 0.85 ) ), nodeVar0, smoothstep( 0.5, 0.9, ( nodeVar0.x * 2.0 ) ) );
	DiffuseColor.w = ( DiffuseColor.w * object.nodeUniform5 );
	DiffuseColor.w = 1.0;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	normalFlat = normalize( cross( dpdx( v_positionView ), - dpdy( v_positionView ) ) );
	normalViewGeometry = normalFlat;
	normalView = normalViewGeometry;
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar2 = dot( normalWorld, normalize( render.nodeUniform10 ) );
	nodeVar3 = ( nodeVar2 * 0.5 );
	nodeVar4 = ( nodeVar3 + 0.5 );
	nodeVar5 = mix( render.nodeUniform6, render.nodeUniform7, nodeVar4 );
	nodeVar6 = ( irradiance + nodeVar5 );
	irradiance = nodeVar6;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	indirectDiffuse = vec4<f32>( 0.0, 0.0, 0.0, 0.0 ).xyz;
	nodeVar7 = ( vec4<f32>( indirectDiffuse, 1.0 ) + vec4<f32>( 1.0, 1.0, 1.0, 0.0 ) );
	indirectDiffuse = nodeVar7.xyz;
	ambientOcclusion = 1.0;
	nodeVar8 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar8;
	nodeVar9 = ( indirectDiffuse * DiffuseColor.xyz );
	indirectDiffuse = nodeVar9;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar10 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar10;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar11 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar11;
	nodeVar12 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar12;
	nodeVar13 = max( vec4<f32>( outgoingLight, DiffuseColor.w ), vec4<f32>( 0.0 ) );
	Output = nodeVar13;

	// result

	output.color = nodeVar13;

	return output;

}
